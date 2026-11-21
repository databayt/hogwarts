// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * POST /api/live/lesson-draft — a teacher asks for a DRAFT quick check and a
 * DRAFT homework for a live class from its textbook lesson. A route handler
 * (not a Server Action) because the answer takes 10–40 s and streams its
 * progress as server-sent events (the chatbot's wire style):
 *
 *   : open                       sent at once — flushes the headers
 *   event: stage  {stage}        reading | writing | saving
 *   : ping                       every 10 s while the model works
 *   event: done   {quickAssessmentId, assignmentId, existing?}
 *   event: error  {code}         a LESSON_DRAFT_* or repo error code
 *
 * Before the stream: 401 NOT_AUTHENTICATED, 400 body/school, 403 for a
 * non-author role or a school that is not the session's. Identity comes from
 * the session only — nothing about the caller is read from the body.
 */
import { auth } from "@/auth"
import { z } from "zod"

import { getTenantContext } from "@/lib/tenant-context"
import { SSE_OPEN, SSE_PING } from "@/components/chatbot/sse"
import { lessonDraftEnabled } from "@/components/lesson-draft/claude"
import { generateLessonDrafts } from "@/components/lesson-draft/generate"
import {
  DRAFT_AUTHOR_ROLES,
  LESSON_DRAFT_ERRORS,
  LessonDraftError,
  type DraftStage,
  type LessonDraftErrorCode,
} from "@/components/lesson-draft/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const bodySchema = z
  .object({
    sessionId: z.string().min(1).max(64).optional(),
    lessonId: z.string().min(1).max(64).optional(),
    // 40–500 chars is enforced by the generator (an error code, not a 400)
    topic: z.string().trim().max(500).optional(),
    assignmentId: z.string().min(1).max(64).optional(),
    replace: z.boolean().optional(),
    homeworkOnly: z.boolean().optional(),
  })
  .strict()

const HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store, no-transform",
  "x-accel-buffering": "no",
}

/** Under `maxDuration`: the stream says TIMEOUT before the platform cuts it. */
const DEADLINE_MS = 55_000

const event = (name: string, data: unknown) =>
  `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`

export async function POST(request: Request): Promise<Response> {
  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role
  if (!userId || !role)
    return Response.json({ error: "NOT_AUTHENTICATED" }, { status: 401 })

  const { schoolId } = await getTenantContext()
  if (!schoolId)
    return Response.json({ error: "MISSING_SCHOOL" }, { status: 400 })
  // Only a platform developer may act in a school that is not their own
  if (role !== "DEVELOPER" && session.user.schoolId !== schoolId)
    return Response.json({ error: "UNAUTHORIZED" }, { status: 403 })
  if (!DRAFT_AUTHOR_ROLES.includes(role))
    return Response.json({ error: "UNAUTHORIZED" }, { status: 403 })
  if (!lessonDraftEnabled())
    return Response.json({ error: "LESSON_DRAFT_DISABLED" }, { status: 404 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success)
    return Response.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  const encoder = new TextEncoder()
  let ping: ReturnType<typeof setInterval> | undefined
  let deadline: ReturnType<typeof setTimeout> | undefined

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const send = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true // the teacher left; the draft still lands
        }
      }
      send(SSE_OPEN)
      ping = setInterval(() => send(SSE_PING), 10_000)

      try {
        const timeout = new Promise<never>((_, reject) => {
          deadline = setTimeout(
            () => reject(new LessonDraftError("LESSON_DRAFT_TIMEOUT")),
            DEADLINE_MS
          )
        })
        const result = await Promise.race([
          generateLessonDrafts(
            { userId, role, schoolId },
            parsed.data,
            (stage: DraftStage) => send(event("stage", { stage }))
          ),
          timeout,
        ])
        send(event("done", result))
      } catch (error) {
        let code: LessonDraftErrorCode = "UNKNOWN"
        if (
          error instanceof LessonDraftError &&
          LESSON_DRAFT_ERRORS.includes(error.code)
        )
          code = error.code
        else console.error("[lesson-draft]", error)
        send(event("error", { code }))
      } finally {
        clearInterval(ping)
        clearTimeout(deadline)
        if (!closed) {
          closed = true
          controller.close()
        }
      }
    },
    cancel() {
      clearInterval(ping)
      clearTimeout(deadline)
    },
  })

  return new Response(stream, { headers: HEADERS })
}
