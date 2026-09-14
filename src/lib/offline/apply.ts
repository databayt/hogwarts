// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"
import { z } from "zod"

import {
  applyLessonProgress,
  completeLessonCore,
} from "@/components/lumos/lib/progress-core"
import {
  ATTEMPT_ID_PATTERN,
  submitLessonQuizCore,
} from "@/components/lumos/lib/quiz-submission"
import {
  quickSubmitSchema,
  submitQuickAttendanceCore,
} from "@/components/school-dashboard/attendance/actions/quick-core"
import { checkAttendancePermission } from "@/components/school-dashboard/attendance/authorization"
import {
  submitAssignmentCore,
  submitAssignmentSchema,
} from "@/components/school-dashboard/listings/assignments/submit-core"

/**
 * Applying a device's outbox — shared by the web drain (`/api/offline/sync`,
 * session) and the native app's (`/api/mobile/offline/sync`, bearer token).
 *
 * Work done offline — playback positions, completions, quiz answers,
 * assignment text, attendance marks — replayed in the order it happened.
 * Every item carries the id the device minted when the work was done, and
 * every kind is idempotent on it (quiz attempts by row, the others by "newer
 * wins"), so a retry after a lost response can never double-count.
 *
 * Per-item verdicts, never all-or-nothing: one rejected quiz must not hold
 * forty progress samples hostage, and the device needs to know exactly which
 * items to drop and which to park.
 */

export const OFFLINE_SYNC_MAX_ITEMS = 50

export const OFFLINE_ITEM_ID = z.string().regex(ATTEMPT_ID_PATTERN)

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
const attendancePayload = quickSubmitSchema

export const offlineItemSchema = z.object({
  id: OFFLINE_ITEM_ID,
  kind: z.enum(["progress", "complete", "quiz", "assignment", "attendance"]),
  payload: z.unknown(),
  createdAt: z.string().datetime({ offset: true }),
})

export const offlineBodySchema = z.object({
  items: z.array(offlineItemSchema).min(1).max(OFFLINE_SYNC_MAX_ITEMS),
})

export type OfflineSyncItem = z.infer<typeof offlineItemSchema>

export type OfflineSyncVerdict = {
  id: string
  result: "applied" | "duplicate" | "rejected"
  /** Rejections name why — the device parks these where the student can see them. */
  code?: string
  /** Quiz items get their graded result back, exactly as the online action returns it. */
  data?: unknown
}

export interface OfflineApplyContext {
  userId: string
  schoolId: string | null
  role: string
  /**
   * Extra gate on assignment attachment URLs. The mobile drain only accepts
   * this school's bucket objects; the web outbox is text-only today.
   */
  acceptAttachment?: (url: string) => boolean
}

/**
 * Apply items sequentially, on purpose: a progress sample and the completion
 * it triggers must land in the order the device recorded them. A thrown item
 * is rejected with ERROR and never takes its neighbours down.
 */
export async function applyOfflineItems(
  items: OfflineSyncItem[],
  ctx: OfflineApplyContext
): Promise<OfflineSyncVerdict[]> {
  const results: OfflineSyncVerdict[] = []
  for (const item of items) {
    try {
      results.push(await applyItem(item, ctx))
    } catch (err) {
      console.error("[offline-sync] item failed:", item.kind, item.id, err)
      results.push({ id: item.id, result: "rejected", code: "ERROR" })
    }
  }
  return results
}

async function applyItem(
  item: OfflineSyncItem,
  ctx: OfflineApplyContext
): Promise<OfflineSyncVerdict> {
  const { userId, schoolId } = ctx
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
      if (
        ctx.acceptAttachment &&
        !(p.data.attachments ?? []).every(ctx.acceptAttachment)
      ) {
        return reject(item, "INVALID_ATTACHMENT")
      }
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

    case "attendance": {
      const p = attendancePayload.safeParse(item.payload)
      if (!p.success) return reject(item, "INVALID_PAYLOAD")
      // Same gate as the online action: role may mark, tenant resolved.
      if (
        !schoolId ||
        !checkAttendancePermission(
          { userId, role: ctx.role as UserRole, schoolId },
          "mark"
        )
      ) {
        return reject(item, "FORBIDDEN")
      }
      const out = await submitQuickAttendanceCore({
        schoolId,
        userId,
        role: ctx.role,
        input: p.data,
        at,
      })
      if (out.status === "marked") {
        const { status: _status, ...summary } = out
        return { id: item.id, result: "applied", data: summary }
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
