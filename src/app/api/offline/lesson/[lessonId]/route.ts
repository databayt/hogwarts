// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getLessonContent } from "@/components/lumos/data/catalog/get-lesson-content"
import { getLessonWithProgress } from "@/components/lumos/data/catalog/get-lesson-with-progress"
import { isExternallyHostedVideo } from "@/components/lumos/video/media-access"

/**
 * GET /api/offline/lesson/[lessonId]
 *
 * The manifest the download manager works from: everything a lesson needs
 * to be studied with no connection — where the video's bytes are, which
 * documents go with it, the summary, and the quiz questions (answer-key
 * free, exactly what the online page ships).
 *
 * Built on the SAME resolvers as the lesson page (`getLessonWithProgress`,
 * `getLessonContent`), so a hidden lesson, an unpublished one, or one the
 * viewer is not enrolled in is invisible here for the same reasons it is
 * invisible there. The video ticket itself is a separate route that
 * re-checks access and the owner's download flag at fetch time.
 */

const PROTECTED_VIDEO = /^\/api\/lumos\/video\/([^/?#]+)/
const PROTECTED_FILE = /^\/api\/lumos\/file\/(material|attachment)\/([^/?#]+)/

export interface OfflineLessonManifest {
  lesson: {
    id: string
    title: string
    description: string | null
    durationMinutes: number | null
    chapter: { id: string; title: string; position: number }
    course: {
      id: string
      title: string
      slug: string
      objectives: string[]
    }
  }
  video:
    | {
        kind: "self-hosted"
        videoId: string
        /** Where to ask for the signed download URL. */
        ticket: string
        downloadable: boolean
        durationSeconds: number | null
        bytes: number | null
      }
    | { kind: "external"; url: string }
    | null
  documents: Array<{
    id: string
    kind: "material" | "attachment"
    title: string
    type: string | null
    /** Where to ask for the signed URL (`?ticket=1` answers JSON). */
    ticket: string
  }>
  questions: Awaited<ReturnType<typeof getLessonContent>>["questions"]
  progress: {
    isCompleted: boolean
    watchedSeconds: number
    totalSeconds: number | null
  } | null
  generatedAt: string
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
): Promise<NextResponse> {
  const { lessonId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = await checkUserRateLimit(
    session.user.id,
    RATE_LIMITS.LUMOS_MEDIA,
    "lumos-media"
  )
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const [lesson, content] = await Promise.all([
    getLessonWithProgress(lessonId),
    getLessonContent(lessonId),
  ])
  if (!lesson) {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }

  const video = await describeVideo(lesson.videoUrl)

  const documents: OfflineLessonManifest["documents"] = []
  for (const m of lesson.materials) {
    const match = m.url ? PROTECTED_FILE.exec(m.url) : null
    if (!match) continue
    documents.push({
      id: m.id,
      kind: "material",
      title: m.title,
      type: m.type,
      ticket: `${match[0]}?ticket=1`,
    })
  }
  for (const a of lesson.attachments) {
    const match = PROTECTED_FILE.exec(a.url)
    if (!match) continue
    documents.push({
      id: a.id,
      kind: "attachment",
      title: a.name,
      type: null,
      ticket: `${match[0]}?ticket=1`,
    })
  }

  const manifest: OfflineLessonManifest = {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      durationMinutes: lesson.duration,
      chapter: {
        id: lesson.chapter.id,
        title: lesson.chapter.title,
        position: lesson.chapter.position,
      },
      course: {
        id: lesson.chapter.course.id,
        title: lesson.chapter.course.title,
        slug: lesson.chapter.course.slug,
        objectives: lesson.chapter.course.objectives,
      },
    },
    video,
    documents,
    questions: content.questions,
    progress: lesson.progress,
    generatedAt: new Date().toISOString(),
  }

  return NextResponse.json(manifest, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  })
}

async function describeVideo(
  videoUrl: string | null
): Promise<OfflineLessonManifest["video"]> {
  if (!videoUrl) return null
  if (isExternallyHostedVideo(videoUrl)) {
    return { kind: "external", url: videoUrl }
  }
  const match = PROTECTED_VIDEO.exec(videoUrl)
  if (!match) return null
  const videoId = match[1]

  // Only the download flag and sizes — access itself was already decided by
  // the lesson resolver, and is decided again by the ticket route.
  const row = await db.video.findUnique({
    where: { id: videoId },
    select: { allowDownload: true, durationSeconds: true, fileSize: true },
  })

  return {
    kind: "self-hosted",
    videoId,
    ticket: `/api/lumos/video/${videoId}/download`,
    downloadable: row?.allowDownload === true,
    durationSeconds: row?.durationSeconds ?? null,
    bytes: row?.fileSize ?? null,
  }
}
