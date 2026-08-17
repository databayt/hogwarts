// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// NOTE: render-time read (the lesson page calls it in both generateMetadata
// and the body) — wrapped in React cache() to dedupe within a request. NOT a
// "use server" action; it is imported only by server components.
import { cache } from "react"
import { auth } from "@/auth"

import { asset } from "@/lib/asset-url"
import { db } from "@/lib/db"
import { isOwnStorageUrl } from "@/lib/storage-key"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import {
  applyInstructorPolicy,
  getInstructorPolicy,
} from "@/components/lumos/lib/instructor-policy"
import {
  buildProtectedFileUrl,
  buildProtectedVideoUrl,
  isExternallyHostedVideo,
} from "@/components/lumos/video/media-access"

export interface AvailableVideo {
  id: string
  // null when the video is PAID and the current user has not purchased it —
  // the server NEVER emits a playable URL for unowned paid content. Client
  // gating (lock UI) is cosmetic; this null is the real paywall.
  videoUrl: string | null
  thumbnailUrl: string | null
  durationSeconds: number | null
  isFeatured: boolean
  source: "own-school" | "featured" | "other-school"
  instructor: {
    id: string
    name: string | null
    image: string | null
    role: string | null
  }
  school: {
    id: string | null
    name: string | null
  }
  // PAID unlock — null price on a PAID video should never happen in practice,
  // but callers must handle the null to stay safe.
  price: number | null
  currency: string | null
  requiresPayment: boolean
  hasPurchased: boolean
}

export interface LessonWithProgress {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  videoDuration: number | null
  position: number
  isPublished: boolean
  isFree: boolean
  chapter: {
    id: string
    title: string
    position: number
    course: {
      id: string
      title: string
      slug: string
      levels: string[]
      grades: number[]
      description: string | null
      objectives: string[]
      prerequisites: string | null
      targetAudience: string | null
    }
  }
  attachments: Array<{
    id: string
    name: string
    url: string
  }>
  // Lesson-level study materials (worksheets, notes, references) — contributed
  // by schools via the subjects catalog surface (submitMaterial) or authored
  // on the platform lane. Same gate as the lesson quiz: APPROVED + PUBLISHED,
  // visible when PUBLIC or contributed by the viewer's own school.
  materials: Array<{
    id: string
    title: string
    description: string | null
    type: string
    url: string | null
  }>
  progress: {
    isCompleted: boolean
    watchedSeconds: number
    totalSeconds: number | null
  } | null
  year: number | null
  color: string | null
  previousLesson: { id: string; title: string } | null
  nextLesson: { id: string; title: string; videoUrl?: string | null } | null
  siblingLessons: Array<{
    id: string
    title: string
    thumbnailUrl: string | null
    color: string | null
    duration: number | null
    lessonPosition: number
    chapterPosition: number
    watchedMinutes: number | null
  }>
  availableVideos: AvailableVideo[]
}

/**
 * The URL the browser is allowed to see for a video it may watch.
 *
 * YouTube/Vimeo keep their own URL — the provider owns access there. Anything
 * we host resolves to an opaque per-video reference instead of the storage
 * URL, so the location of the file never reaches the client and every fetch
 * is re-authorized. See `video/media-access.ts`.
 */
function toPlayableUrl(video: {
  id: string
  videoUrl: string | null
}): string | null {
  if (!video.videoUrl) return null
  if (isExternallyHostedVideo(video.videoUrl)) return video.videoUrl
  return buildProtectedVideoUrl(video.id)
}

/**
 * Fetches catalog lesson with progress data and video sources.
 * Migration: Replaces get-lesson-with-progress.ts which queries StreamLesson.
 */
export const getLessonWithProgress = cache(async function getLessonWithProgress(
  lessonId: string
): Promise<LessonWithProgress | null> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user) {
    return null
  }

  try {
    const lesson = await db.lesson.findFirst({
      where: {
        id: lessonId,
        status: "PUBLISHED",
      },
      include: {
        chapter: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                levels: true,
                grades: true,
                description: true,
                objectives: true,
                prerequisites: true,
                targetAudience: true,
              },
            },
          },
        },
      },
    })

    if (!lesson) {
      return null
    }

    // Check enrollment (or admin/teacher access)
    const isAdmin = ["ADMIN", "TEACHER", "DEVELOPER"].includes(
      session.user.role || ""
    )
    let isEnrolled = false

    if (!isAdmin) {
      const enrollment = await db.enrollment.findFirst({
        where: {
          userId: session.user.id,
          catalogSubjectId: lesson.chapter.subject.id,
          isActive: true,
        },
        select: { id: true },
      })
      isEnrolled = !!enrollment
    }

    // Block non-enrolled users only for paid content; free content is accessible to all
    if (!isEnrolled && !isAdmin) {
      const subject = await db.subject.findUnique({
        where: { id: lesson.chapter.subject.id },
        select: { price: true },
      })
      const isPaid = subject?.price && Number(subject.price) > 0

      if (isPaid) {
        return null
      }
    }

    // ── Wave 1: independent reads in parallel ──────────────────────────────
    // (progress, attachments, videos, all-lessons) have no inter-dependency,
    // so collapse ~4 serial Neon round-trips into one.
    const [progress, attachments, materials, videos, allLessons] =
      await Promise.all([
        // Lesson progress
        db.lessonProgress.findUnique({
          where: {
            userId_catalogLessonId: {
              userId: session.user.id,
              catalogLessonId: lessonId,
            },
          },
          select: {
            isCompleted: true,
            watchedSeconds: true,
            totalSeconds: true,
          },
        }),
        // Attachments
        db.attachment.findMany({
          where: { catalogLessonId: lessonId },
          select: { id: true, name: true, url: true },
        }),
        // Lesson materials. Mirrors the lesson-quiz gate in
        // get-lesson-content.ts: only approved+published rows, PUBLIC or
        // contributed by the viewer's own school (a school's SCHOOL/PRIVATE
        // material must never surface to other tenants).
        db.material.findMany({
          where: {
            catalogLessonId: lessonId,
            approvalStatus: "APPROVED",
            status: "PUBLISHED",
            OR: [
              { visibility: "PUBLIC" },
              ...(schoolId ? [{ contributedSchoolId: schoolId }] : []),
            ],
          },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileUrl: true,
            externalUrl: true,
          },
          orderBy: { createdAt: "asc" },
        }),
        // ALL approved videos for this lesson (multi-instructor support).
        // Excludes videos hidden by the school via ContentOverride.
        // PAID videos surface across all schools — payment gate happens per-user.
        db.video.findMany({
          where: {
            catalogLessonId: lessonId,
            approvalStatus: "APPROVED",
            // Visibility gate. PRIVATE is owner-only — the bare `{ schoolId }`
            // arm used to leak every PRIVATE video to all school members (and
            // turned `revokeVideoAccess` → PRIVATE into a free-for-the-school
            // paywall bypass). Now: owner sees their own (any visibility);
            // school members see the school's SCHOOL/PUBLIC/PAID videos; everyone
            // sees PUBLIC/PAID.
            ...(schoolId
              ? {
                  OR: [
                    { userId: session.user.id },
                    {
                      schoolId,
                      visibility: { in: ["SCHOOL", "PUBLIC", "PAID"] },
                    },
                    { visibility: "PUBLIC" },
                    { visibility: "PAID" },
                  ],
                  NOT: {
                    overrides: { some: { schoolId, isHidden: true } },
                  },
                }
              : {
                  OR: [
                    { userId: session.user.id },
                    { visibility: "PUBLIC" },
                    { visibility: "PAID" },
                  ],
                }),
          },
          orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
          select: {
            id: true,
            videoUrl: true,
            thumbnailUrl: true,
            durationSeconds: true,
            isFeatured: true,
            schoolId: true,
            visibility: true,
            price: true,
            currency: true,
            user: {
              select: { id: true, username: true, image: true, role: true },
            },
            school: { select: { id: true, name: true } },
          },
        }),
        // All lessons in the subject for navigation (hidden chapters/lessons
        // excluded via ContentOverride).
        db.lesson.findMany({
          where: {
            chapter: {
              subjectId: lesson.chapter.subject.id,
              ...(schoolId
                ? { NOT: { overrides: { some: { schoolId, isHidden: true } } } }
                : {}),
            },
            status: "PUBLISHED",
            ...(schoolId
              ? { NOT: { overrides: { some: { schoolId, isHidden: true } } } }
              : {}),
          },
          select: {
            id: true,
            name: true,
            sequenceOrder: true,
            thumbnail: true,
            color: true,
            durationMinutes: true,
            chapter: {
              select: { sequenceOrder: true, name: true, color: true },
            },
          },
          orderBy: [
            { chapter: { sequenceOrder: "asc" } },
            { sequenceOrder: "asc" },
          ],
        }),
      ])

    // ── Wave 2: reads that depend on Wave 1 results, also parallelized ──────
    const paidVideoIds = videos
      .filter((v) => v.visibility === "PAID")
      .map((v) => v.id)
    const siblingIds = allLessons
      .filter((l) => l.id !== lessonId)
      .map((l) => l.id)

    const [purchaseRows, preference, policy, siblingProgress] =
      await Promise.all([
        // Batch-check purchases so PAID videos resolve unlock state in one query.
        paidVideoIds.length > 0
          ? db.videoPurchase.findMany({
              where: {
                userId: session.user.id,
                videoId: { in: paidVideoIds },
                status: "SUCCESS",
              },
              select: { videoId: true },
            })
          : Promise.resolve([] as { videoId: string }[]),
        // Instructor preference (only relevant when multiple videos exist).
        schoolId && videos.length > 1
          ? db.instructorPreference.findUnique({
              where: {
                schoolId_catalogSubjectId: {
                  schoolId,
                  catalogSubjectId: lesson.chapter.subject.id,
                },
              },
            })
          : Promise.resolve(null),
        // The school's instructor policy — disabled instructors and the lock.
        // Unconditional (not gated on videos.length like the preference above):
        // a block has to be able to remove the only video there is.
        getInstructorPolicy(schoolId),
        // Progress for sibling lessons.
        siblingIds.length > 0
          ? db.lessonProgress.findMany({
              where: {
                userId: session.user.id,
                catalogLessonId: { in: siblingIds },
              },
              select: { catalogLessonId: true, watchedSeconds: true },
            })
          : Promise.resolve(
              [] as { catalogLessonId: string; watchedSeconds: number }[]
            ),
      ])

    const purchasedIds = new Set<string>(purchaseRows.map((p) => p.videoId))

    // Apply the school's instructor policy: drop disabled instructors, honour
    // the lock where it has coverage, then order by per-subject preference →
    // school default → the query's own [isFeatured, viewCount] ranking. Shared
    // with the roster and the mobile lane so the three cannot disagree.
    const rankedVideos = applyInstructorPolicy(videos, policy, preference)

    // Use the first (highest-ranked or preferred) video as default
    const video = rankedVideos[0] ?? null

    const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
    const previousLesson =
      currentIndex > 0 ? allLessons[currentIndex - 1] : null
    const nextLesson =
      currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

    const progressMap = new Map(
      siblingProgress.map((p) => [p.catalogLessonId, p.watchedSeconds])
    )

    // Transform the default video URL — gate PAID content on purchase.
    // Owned (or free) → a protected reference the browser can play.
    // Unowned PAID → null so the player has no source to play.
    //
    // Self-hosted videos NEVER emit a storage URL: `toPlayableUrl` returns an
    // `/api/lumos/video/<id>` reference that re-authorizes on every request
    // and hands back a short-lived signed URL. Emitting the storage URL here
    // is what made every school video world-readable and permanent.
    const defaultRequiresPayment = video?.visibility === "PAID"
    const defaultOwned = video
      ? defaultRequiresPayment
        ? purchasedIds.has(video.id)
        : true
      : false
    const transformedVideoUrl =
      video && defaultOwned ? toPlayableUrl(video) : null

    // Map available videos with source labels. Own-school takes priority over
    // "featured" so a school's own featured video reads as "own-school", not
    // the platform "featured" badge.
    const availableVideos: AvailableVideo[] = rankedVideos.map((v) => {
      let source: AvailableVideo["source"] = "other-school"
      if (schoolId && v.schoolId === schoolId) source = "own-school"
      else if (v.isFeatured) source = "featured"

      const requiresPayment = v.visibility === "PAID"
      // Owned = free video, or paid video the user has a SUCCESS purchase for.
      const owned = requiresPayment ? purchasedIds.has(v.id) : true

      return {
        id: v.id,
        // Paid + unpurchased → null (no playable URL leaves the server).
        // Otherwise → a protected `/api/lumos/video/<id>` reference for
        // self-hosted content, or the provider's own URL for YouTube/Vimeo.
        videoUrl: owned ? toPlayableUrl(v) : null,
        thumbnailUrl: v.thumbnailUrl,
        durationSeconds: v.durationSeconds,
        isFeatured: v.isFeatured,
        source,
        instructor: {
          id: v.user.id,
          name:
            v.isFeatured && !v.schoolId
              ? "balqalam"
              : (v.user.username ?? v.school?.name ?? null),
          image:
            v.isFeatured && !v.schoolId
              ? asset("/icons/logo.png")
              : v.user.image,
          role: v.user.role ?? null,
        },
        school: {
          id: v.school?.id ?? null,
          name: v.school?.name ?? null,
        },
        price: v.price,
        currency: v.currency,
        requiresPayment,
        hasPurchased: owned,
      }
    })

    return {
      id: lesson.id,
      title: lesson.name,
      description: lesson.description,
      videoUrl: transformedVideoUrl,
      thumbnailUrl: getCatalogImageUrl(lesson.thumbnail, "original") ?? null,
      duration:
        lesson.durationMinutes ??
        (lesson.videoCount > 0 ? lesson.videoCount * 5 : null),
      videoDuration: video?.durationSeconds ?? null,
      position: lesson.sequenceOrder,
      isPublished: true,
      isFree: true,
      chapter: {
        id: lesson.chapter.id,
        title: lesson.chapter.name,
        position: lesson.chapter.sequenceOrder,
        course: {
          id: lesson.chapter.subject.id,
          title: lesson.chapter.subject.name,
          slug: lesson.chapter.subject.slug,
          levels: lesson.chapter.subject.levels as string[],
          grades: lesson.chapter.subject.grades as number[],
          description: lesson.chapter.subject.description,
          objectives: lesson.chapter.subject.objectives,
          prerequisites: lesson.chapter.subject.prerequisites,
          targetAudience: lesson.chapter.subject.targetAudience,
        },
      },
      year: lesson.createdAt ? new Date(lesson.createdAt).getFullYear() : null,
      color:
        lesson.color ??
        lesson.chapter.color ??
        lesson.chapter.subject.color ??
        null,
      // Self-hosted attachments resolve to a protected reference for the same
      // reason videos do — a worksheet URL in the page is a permanent public
      // link to school work product.
      attachments: attachments.map((a) => ({
        id: a.id,
        name: a.name,
        url: isOwnStorageUrl(a.url)
          ? buildProtectedFileUrl("attachment", a.id)
          : a.url,
      })),
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        // Prefer the external link (someone else's host, not ours to sign);
        // self-hosted files go through the protected route. A row with
        // neither still renders (title-only study note).
        url:
          m.externalUrl ??
          (m.fileUrl ? buildProtectedFileUrl("material", m.id) : null),
      })),
      progress: progress
        ? {
            isCompleted: progress.isCompleted,
            watchedSeconds: progress.watchedSeconds,
            totalSeconds: progress.totalSeconds,
          }
        : null,
      previousLesson: previousLesson
        ? { id: previousLesson.id, title: previousLesson.name }
        : null,
      nextLesson: nextLesson
        ? { id: nextLesson.id, title: nextLesson.name }
        : null,
      siblingLessons: allLessons
        .filter((l) => l.id !== lessonId)
        .map((l) => ({
          id: l.id,
          title: l.name,
          thumbnailUrl: getCatalogImageUrl(l.thumbnail, "original") ?? null,
          color: l.color ?? l.chapter.color ?? null,
          duration: l.durationMinutes,
          lessonPosition: l.sequenceOrder,
          chapterPosition: l.chapter.sequenceOrder,
          watchedMinutes: progressMap.has(l.id)
            ? Math.floor(progressMap.get(l.id)! / 60)
            : null,
        })),
      availableVideos,
    }
  } catch (error) {
    console.error("[getLessonWithProgress] Prisma error:", {
      name: (error as Error)?.constructor?.name,
      code: (error as Record<string, unknown>)?.code,
      message: (error as Error)?.message,
      meta: (error as Record<string, unknown>)?.meta,
      lessonId,
      schoolId,
    })
    throw error
  }
})
