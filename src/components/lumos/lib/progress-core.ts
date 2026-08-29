// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { db } from "@/lib/db"
import { i18n, type Locale } from "@/components/internationalization/config"
import { sendCompletionEmail } from "@/components/lumos/shared/email-service"
import { lumosTenantUrl } from "@/components/lumos/shared/tenant-url"

/**
 * The ONE place lesson progress and lesson completion are written.
 *
 * Two callers share it: the `updateLessonProgress` / `markLessonComplete`
 * server actions the player fires while online, and `POST /api/offline/sync`
 * replaying an outbox that filled up while the student had no connection.
 * Before this module the player was the only writer and "complete" meant
 * "the <video> element fired `ended`" — a rule the offline viewer could not
 * reproduce and the browser itself is unreliable about (a seek to the last
 * frame fires it; a tab closed at 99% never does). Completion is now a
 * server-side function of the watched position, so both paths converge on
 * the same answer for the same viewing.
 *
 * Plain module, NOT `"use server"`: every export of a `"use server"` file is a
 * POST endpoint, and these functions take a `userId` from the caller.
 */

/** Within this many seconds of the end counts as "watched through". */
export const COMPLETION_TAIL_SECONDS = 30
/** …or, for clips too short for the tail rule to mean anything, this fraction. */
export const COMPLETION_RATIO = 0.9

/**
 * Watched through = reached the stricter of the two marks: the final 30
 * seconds, or 90% of the runtime. A one-hour lecture needs 59:30; a 60-second
 * clip needs 54s. Never true without a known runtime — an unknown total would
 * otherwise complete on the first heartbeat.
 */
export function isWatchedThrough(
  watchedSeconds: number,
  totalSeconds: number | null | undefined
): boolean {
  if (!totalSeconds || totalSeconds <= 0) return false
  const threshold = Math.max(
    totalSeconds - COMPLETION_TAIL_SECONDS,
    totalSeconds * COMPLETION_RATIO
  )
  return watchedSeconds >= threshold
}

export type CompletionOutcome =
  | { status: "completed"; certificateIssued: boolean }
  /** Signed in but not enrolled in the subject — nothing to attach progress to. */
  | { status: "noEnrollment" }
  | { status: "notFound" }

export type ProgressOutcome =
  | { status: "saved"; completed: boolean }
  /** A replayed sample older than what is already stored — ignored, not an error. */
  | { status: "stale" }
  | { status: "noEnrollment" }
  | { status: "notFound" }

/** Resolve the viewer's locale from the cookie the app sets on every visit. */
async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get("NEXT_LOCALE")?.value
  return i18n.locales.includes(value as Locale)
    ? (value as Locale)
    : i18n.defaultLocale
}

function revalidateLessonPages() {
  // Route PATTERNS, never a blended path — a real id inside a bracketed path
  // matches no cache tag. The course page shows the completion tick, the
  // lesson page shows the resume position.
  revalidatePath("/[lang]/s/[subdomain]/lumos/courses/[slug]", "page")
  revalidatePath(
    "/[lang]/s/[subdomain]/lumos/courses/[slug]/[lessonId]",
    "page"
  )
}

/**
 * Record a playback position. Completes the lesson when the position crosses
 * the watched-through mark and the row is not already complete — completion
 * is never auto-unset by a later, earlier sample (rewinding is not
 * un-learning; `markLessonIncomplete` is the explicit way back).
 */
export async function applyLessonProgress(input: {
  userId: string
  lessonId: string
  watchedSeconds: number
  totalSeconds: number
  /**
   * When the sample was taken. The outbox replays samples that may be hours
   * old, out of order with samples that arrived live; one must never regress
   * a newer row.
   */
  at?: Date
}): Promise<ProgressOutcome> {
  const at = input.at ?? new Date()
  const watchedSeconds = Math.max(0, Math.floor(input.watchedSeconds))
  const totalSeconds = Math.max(0, Math.floor(input.totalSeconds))

  const lesson = await db.lesson.findUnique({
    where: { id: input.lessonId },
    select: { chapter: { select: { subjectId: true } } },
  })
  if (!lesson) return { status: "notFound" }

  const enrollment = await db.enrollment.findFirst({
    where: {
      userId: input.userId,
      catalogSubjectId: lesson.chapter.subjectId,
      isActive: true,
    },
    select: { id: true },
  })
  if (!enrollment) return { status: "noEnrollment" }

  const existing = await db.lessonProgress.findUnique({
    where: {
      userId_catalogLessonId: {
        userId: input.userId,
        catalogLessonId: input.lessonId,
      },
    },
    select: { lastWatchedAt: true, isCompleted: true },
  })
  if (existing && existing.lastWatchedAt > at) return { status: "stale" }

  await db.lessonProgress.upsert({
    where: {
      userId_catalogLessonId: {
        userId: input.userId,
        catalogLessonId: input.lessonId,
      },
    },
    update: {
      watchedSeconds,
      totalSeconds,
      lastWatchedAt: at,
      updatedAt: new Date(),
    },
    create: {
      userId: input.userId,
      catalogLessonId: input.lessonId,
      enrollmentId: enrollment.id,
      watchedSeconds,
      totalSeconds,
      lastWatchedAt: at,
      watchCount: 1,
      isCompleted: false,
    },
    select: { id: true },
  })

  if (
    !existing?.isCompleted &&
    isWatchedThrough(watchedSeconds, totalSeconds)
  ) {
    const done = await completeLessonCore({
      userId: input.userId,
      lessonId: input.lessonId,
      at,
    })
    return { status: "saved", completed: done.status === "completed" }
  }

  return { status: "saved", completed: existing?.isCompleted === true }
}

/**
 * Mark a lesson complete for a user and, when that was the last visible
 * lesson of the subject, complete the enrollment and issue the certificate.
 * Callers own the permission decision (who may write progress for whom).
 */
export async function completeLessonCore(input: {
  userId: string
  lessonId: string
  at?: Date
}): Promise<CompletionOutcome> {
  const { userId, lessonId } = input
  const at = input.at ?? new Date()

  // Verify lesson exists and get subject context
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      chapter: {
        select: {
          subjectId: true,
          subject: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  })
  if (!lesson) return { status: "notFound" }

  const subjectId = lesson.chapter.subjectId

  // Single enrollment lookup serves both the permission gate and the FK
  // link (was two identical findFirst round-trips on the same unique row).
  const enrollment = await db.enrollment.findFirst({
    where: { userId, catalogSubjectId: subjectId, isActive: true },
    select: { id: true, schoolId: true },
  })
  if (!enrollment) return { status: "noEnrollment" }

  // The upsert, the subject's lesson list, and the school's hide overrides
  // are independent — run them together. The completion count below still
  // depends on all three.
  const [, allLessons, overrides] = await Promise.all([
    db.lessonProgress.upsert({
      where: { userId_catalogLessonId: { userId, catalogLessonId: lessonId } },
      update: { isCompleted: true, completedAt: at, updatedAt: new Date() },
      create: {
        userId,
        catalogLessonId: lessonId,
        enrollmentId: enrollment.id,
        isCompleted: true,
        completedAt: at,
        lastWatchedAt: at,
      },
    }),
    // All published lessons in the subject (for the all-complete check).
    db.lesson.findMany({
      where: { chapter: { subjectId }, status: "PUBLISHED" },
      select: { id: true, chapterId: true },
    }),
    // The school's hidden chapters/lessons. Hidden content is invisible to
    // students (get-course.ts filters it out of the course view), so it
    // must not count toward completion — otherwise a school hiding a single
    // lesson makes `completedLessons === allLessons.length` impossible and
    // the certificate permanently unreachable. hideQuiz-only rows carry
    // isHidden=false and are correctly ignored here.
    enrollment.schoolId
      ? db.contentOverride.findMany({
          where: {
            schoolId: enrollment.schoolId,
            isHidden: true,
            OR: [
              { catalogChapterId: { not: null } },
              { catalogLessonId: { not: null } },
            ],
          },
          select: { catalogChapterId: true, catalogLessonId: true },
        })
      : Promise.resolve([]),
  ])

  const hiddenChapterIds = new Set(
    overrides.map((o) => o.catalogChapterId).filter(Boolean)
  )
  const hiddenLessonIds = new Set(
    overrides.map((o) => o.catalogLessonId).filter(Boolean)
  )
  const visibleLessons = allLessons.filter(
    (l) => !hiddenLessonIds.has(l.id) && !hiddenChapterIds.has(l.chapterId)
  )

  const completedLessons = await db.lessonProgress.count({
    where: {
      userId,
      catalogLessonId: { in: visibleLessons.map((l) => l.id) },
      isCompleted: true,
    },
  })

  let certificateIssued = false

  // If all school-visible lessons completed, issue certificate
  if (completedLessons === visibleLessons.length && visibleLessons.length > 0) {
    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "COMPLETED" },
    })

    const existingCert = await db.subjectCertificate.findFirst({
      where: { userId, catalogSubjectId: subjectId },
    })

    if (!existingCert) {
      const subject = lesson.chapter.subject
      const schoolId = enrollment.schoolId
      const certNumber = `CERT-${(schoolId || "PLAT").slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

      await db.subjectCertificate.create({
        data: {
          userId,
          catalogSubjectId: subjectId,
          enrollmentId: enrollment.id,
          schoolId: schoolId ?? null,
          subjectTitle: subject.name,
          certificateNumber: certNumber,
          completedAt: at,
        },
      })
      certificateIssued = true

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      })
      const school = schoolId
        ? await db.school.findUnique({
            where: { id: schoolId },
            select: { name: true },
          })
        : null

      if (user?.email) {
        const locale = await resolveLocale()
        sendCompletionEmail({
          to: user.email,
          studentName: user.username || "Student",
          courseTitle: subject.name,
          certificateUrl: await lumosTenantUrl(
            `/lumos/courses/${subject.slug}/certificate`,
            locale
          ),
          schoolName: school?.name || "Platform",
          completionDate: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        }).catch((err) =>
          console.error("Failed to send completion email:", err)
        )
      }
    }
  }

  revalidateLessonPages()
  return { status: "completed", certificateIssued }
}
