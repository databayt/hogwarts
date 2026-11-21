// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { costUsd } from "@/components/chatbot/claude/pricing"
import { laneSpendSince } from "@/lib/ai/budget"
import { db } from "@/lib/db"
import { ensurePlatformSchool, PLATFORM_SCHOOL_ID } from "@/lib/platform-tenant"

/**
 * The lesson-draft lane's own spend ledger — the chatbot's pattern
 * (`chatbot/spend.ts`, not edited), its own lane: LESSON_DRAFT_CAP_USD a
 * month (default $10), LESSON_DRAFT_DAILY_USD a day (default $1), and
 * LESSON_DRAFT_TEACHER_DAILY runs per teacher a day (default 10).
 *
 * Rows go to AIUsageLog under the platform sentinel school (so the existing
 * `laneSpendSince` reader works) with jobType "lesson-draft", the teacher's
 * userId, and jobId `${schoolId}:${sessionId ?? assignmentId ?? "adhoc"}` —
 * the school and class are recoverable from the jobId. Fails CLOSED: a ledger
 * it cannot read means no draft.
 */
export const JOB_TYPE = "lesson-draft"
export const SPEND_LANES = [JOB_TYPE]

const monthCap = () => Number(process.env.LESSON_DRAFT_CAP_USD ?? 10)
const dayCap = () => Number(process.env.LESSON_DRAFT_DAILY_USD ?? 1)
const teacherDaily = () => Number(process.env.LESSON_DRAFT_TEACHER_DAILY ?? 10)
const SEED_MS = 60_000

let seed: { at: number; month: number; day: number; dayKey: string } | null =
  null
let reserved = 0
const heldRuns = new Map<string, number>()

const dayKeyOf = (d: Date) => d.toISOString().slice(0, 10)

async function readSeed() {
  const now = new Date()
  if (seed && Date.now() - seed.at < SEED_MS && seed.dayKey === dayKeyOf(now))
    return seed
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  )
  const dayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  const [month, day] = await Promise.all([
    laneSpendSince(SPEND_LANES, monthStart),
    laneSpendSince(SPEND_LANES, dayStart),
  ])
  seed = { at: Date.now(), month, day, dayKey: dayKeyOf(now) }
  return seed
}

/** What a draft may cost at most: the first call plus its one retry. */
export function estimateDraftCost(promptChars: number): number {
  const input = Math.ceil(promptChars / 2.5)
  return 2 * costUsd({ input, read: 0, write: 0, write1h: 0, output: 3000 })
}

export type Reservation =
  | { ok: true; estimate: number }
  | { ok: false; reason: "cap" | "teacher_limit" }

/**
 * May this teacher spend about `estimate` now? If so it is held until
 * `settle()`, so two drafts at once cannot both squeeze under a cap.
 */
export async function reserve(
  userId: string,
  estimate: number
): Promise<Reservation> {
  let s: Awaited<ReturnType<typeof readSeed>>
  let runsToday: number
  try {
    s = await readSeed()
    const dayStart = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate()
      )
    )
    runsToday = await db.aIUsageLog.count({
      where: {
        schoolId: PLATFORM_SCHOOL_ID,
        jobType: JOB_TYPE,
        userId,
        createdAt: { gte: dayStart },
      },
    })
  } catch (error) {
    console.error("[lesson-draft] spend ledger unreadable — draft off", error)
    return { ok: false, reason: "cap" }
  }

  if (runsToday + (heldRuns.get(userId) ?? 0) >= teacherDaily())
    return { ok: false, reason: "teacher_limit" }
  const fits =
    s.month + reserved + estimate <= monthCap() &&
    s.day + reserved + estimate <= dayCap()
  if (!fits) return { ok: false, reason: "cap" }

  reserved += estimate
  heldRuns.set(userId, (heldRuns.get(userId) ?? 0) + 1)
  return { ok: true, estimate }
}

/**
 * Release the hold and write the usage row. Always logs when a call was made
 * (`spent` non-null) — even a failed run counts toward the teacher's day.
 */
export async function settle(
  userId: string,
  estimate: number,
  spent: {
    costUsd: number
    model: string
    inputTokens: number
    outputTokens: number
    jobId: string
  } | null
) {
  reserved = Math.max(0, reserved - estimate)
  const held = (heldRuns.get(userId) ?? 1) - 1
  if (held <= 0) heldRuns.delete(userId)
  else heldRuns.set(userId, held)
  if (!spent) return
  if (seed) {
    seed.month += spent.costUsd
    seed.day += spent.costUsd
  }
  try {
    await ensurePlatformSchool()
    await db.aIUsageLog.create({
      data: {
        schoolId: PLATFORM_SCHOOL_ID,
        userId,
        jobType: JOB_TYPE,
        model: spent.model,
        provider: "anthropic",
        inputTokens: spent.inputTokens,
        outputTokens: spent.outputTokens,
        costUsd: spent.costUsd,
        jobId: spent.jobId,
      },
    })
  } catch (error) {
    console.error("[lesson-draft] spend not recorded", error)
  }
}

export const jobIdFor = (
  schoolId: string,
  ref: { sessionId?: string; assignmentId?: string }
) => `${schoolId}:${ref.sessionId ?? ref.assignmentId ?? "adhoc"}`

/** Tests only. */
export function __resetSpend() {
  seed = null
  reserved = 0
  heldRuns.clear()
}
