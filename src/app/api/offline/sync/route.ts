// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"

import { checkUserRateLimit } from "@/lib/rate-limit"
import { getTenantContext } from "@/lib/tenant-context"
import {
  applyLessonProgress,
  completeLessonCore,
} from "@/components/lumos/lib/progress-core"
import {
  ATTEMPT_ID_PATTERN,
  submitLessonQuizCore,
} from "@/components/lumos/lib/quiz-submission"
import {
  submitAssignmentCore,
  submitAssignmentSchema,
} from "@/components/school-dashboard/listings/assignments/submit-core"

/**
 * POST /api/offline/sync
 *
 * Drains a device's outbox: work a student did while offline — playback
 * positions, completions, quiz answers, assignment text — replayed in the
 * order it happened. Every item carries the id the device minted when the
 * work was done, and every kind is idempotent on it (quiz attempts by row,
 * the others by "newer wins"), so a retry after a lost response can never
 * double-count.
 *
 * Per-item verdicts, never all-or-nothing: one rejected quiz must not hold
 * forty progress samples hostage, and the device needs to know exactly which
 * items to drop and which to park.
 *
 * A route handler, not an action — see the notifications bell for why every
 * client-invoked action ships a full RSC re-render.
 */

const ID = z.string().regex(ATTEMPT_ID_PATTERN)

const progressPayload = z.object({
  lessonId: z.string().min(1).max(64),
  watchedSeconds: z
    .number()
    .int()
    .min(0)
    .max(24 * 3600),
  totalSeconds: z
    .number()
    .int()
    .min(0)
    .max(24 * 3600),
})

const completePayload = z.object({ lessonId: z.string().min(1).max(64) })

const quizPayload = z.object({
  lessonId: z.string().min(1).max(64),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1).max(64),
        selectedOptionIndex: z.number().int().min(0).max(50).optional(),
        answerText: z.string().max(2000).optional(),
      })
    )
    .max(100),
})

const assignmentPayload = submitAssignmentSchema

const itemSchema = z.object({
  id: ID,
  kind: z.enum(["progress", "complete", "quiz", "assignment"]),
  payload: z.unknown(),
  createdAt: z.string().datetime({ offset: true }),
})

const bodySchema = z.object({ items: z.array(itemSchema).min(1).max(50) })

export type OfflineSyncItem = z.infer<typeof itemSchema>

export type OfflineSyncVerdict = {
  id: string
  result: "applied" | "duplicate" | "rejected"
  /** Rejections name why — the device parks these where the student can see them. */
  code?: string
  /** Quiz items get their graded result back, exactly as the online action returns it. */
  data?: unknown
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  const rl = await checkUserRateLimit(
    userId,
    { windowMs: 60 * 1000, maxRequests: 20 },
    "offline-sync"
  )
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { schoolId } = await getTenantContext()

  // Sequential on purpose: a progress sample and the completion it triggers
  // must land in the order the device recorded them.
  const results: OfflineSyncVerdict[] = []
  for (const item of parsed.data.items) {
    try {
      results.push(await applyItem(item, userId, schoolId))
    } catch (err) {
      console.error("[offline-sync] item failed:", item.kind, item.id, err)
      results.push({ id: item.id, result: "rejected", code: "ERROR" })
    }
  }

  return NextResponse.json(
    { results, serverTime: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  )
}

async function applyItem(
  item: OfflineSyncItem,
  userId: string,
  schoolId: string | null
): Promise<OfflineSyncVerdict> {
  const at = new Date(item.createdAt)

  switch (item.kind) {
    case "progress": {
      const p = progressPayload.safeParse(item.payload)
      if (!p.success) return reject(item, "INVALID_PAYLOAD")
      const out = await applyLessonProgress({ userId, ...p.data, at })
      if (out.status === "saved") return { id: item.id, result: "applied" }
      if (out.status === "stale") return { id: item.id, result: "duplicate" }
      return reject(item, codeFor(out.status))
    }

    case "complete": {
      const p = completePayload.safeParse(item.payload)
      if (!p.success) return reject(item, "INVALID_PAYLOAD")
      const out = await completeLessonCore({
        userId,
        lessonId: p.data.lessonId,
        at,
      })
      if (out.status === "completed") return { id: item.id, result: "applied" }
      return reject(item, codeFor(out.status))
    }

    case "quiz": {
      const p = quizPayload.safeParse(item.payload)
      if (!p.success) return reject(item, "INVALID_PAYLOAD")
      const out = await submitLessonQuizCore({
        userId,
        schoolId,
        lessonId: p.data.lessonId,
        answers: p.data.answers,
        attemptId: item.id,
        source: "offline",
        submittedAt: at,
      })
      if (out.status === "graded") {
        return {
          id: item.id,
          result: out.duplicate ? "duplicate" : "applied",
          data: out.result,
        }
      }
      return reject(
        item,
        out.status === "forbidden" ? "FORBIDDEN" : "NO_QUESTIONS"
      )
    }

    case "assignment": {
      const p = assignmentPayload.safeParse(item.payload)
      if (!p.success) return reject(item, "INVALID_PAYLOAD")
      if (!schoolId) return reject(item, "NO_SCHOOL")
      const out = await submitAssignmentCore({
        userId,
        schoolId,
        assignmentId: p.data.assignmentId,
        content: p.data.content?.trim() || null,
        attachments: p.data.attachments ?? [],
        submittedAt: at,
      })
      if (out.status === "submitted") {
        return {
          id: item.id,
          result: "applied",
          data: { status: out.submissionStatus },
        }
      }
      if (out.status === "stale") return { id: item.id, result: "duplicate" }
      return reject(item, codeFor(out.status))
    }
  }
}

function reject(item: OfflineSyncItem, code: string): OfflineSyncVerdict {
  return { id: item.id, result: "rejected", code }
}

/** camelCase outcome → the SCREAMING_SNAKE code the device shows and logs. */
function codeFor(status: string): string {
  return status.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()
}
