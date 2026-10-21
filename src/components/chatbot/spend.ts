// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { laneSpendSince } from "@/lib/ai/budget"
import { db } from "@/lib/db"
import { ensurePlatformSchool, PLATFORM_SCHOOL_ID } from "@/lib/platform-tenant"

/**
 * The chatbot's Claude spend against its caps
 * (D-20261021-included-api-credits-for-hogwarts-chatbot): $18 a month and
 * $2 a day in the app, under the Console workspace's $20 limit, so that
 * limit never trips mid-answer. Read from AIUsageLog's platform rows — a
 * deleted chat can't erase spend — at most once a minute, plus what this
 * process spent since. Fails CLOSED: a ledger it can't read means Groq.
 */
export const SPEND_LANES = ["chatbot", "chatbot-notes"]

const monthCap = () => Number(process.env.CHATBOT_CLAUDE_CAP_USD ?? 18)
const dayCap = () => Number(process.env.CHATBOT_CLAUDE_DAILY_USD ?? 2)
const SEED_MS = 60_000

let seed: { at: number; month: number; day: number; dayKey: string } | null =
  null
let reserved = 0
let cappedUntil = 0

const dayKeyOf = (d: Date) => d.toISOString().slice(0, 10)

async function readSeed() {
  const now = new Date()
  if (seed && Date.now() - seed.at < SEED_MS && seed.dayKey === dayKeyOf(now))
    return seed
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
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

/**
 * May this request spend about `estimate`? If so it is held until
 * `settle()` — two answers at once can't both squeeze under the cap.
 */
export async function reserve(estimate: number): Promise<boolean> {
  if (Date.now() < cappedUntil) return false
  let s: Awaited<ReturnType<typeof readSeed>>
  try {
    s = await readSeed()
  } catch (error) {
    console.error("[chatbot] spend ledger unreadable — Claude off", error)
    return false
  }
  const ok =
    s.month + reserved + estimate <= monthCap() &&
    s.day + reserved + estimate <= dayCap()
  if (ok) reserved += estimate
  return ok
}

/** Release the hold and record what the answer actually cost. */
export async function settle(
  estimate: number,
  spent: {
    costUsd: number
    model: string
    inputTokens: number
    outputTokens: number
    jobType: "chatbot" | "chatbot-notes"
    jobId?: string
  } | null
) {
  reserved = Math.max(0, reserved - estimate)
  if (!spent || spent.costUsd <= 0) return
  if (seed) {
    seed.month += spent.costUsd
    seed.day += spent.costUsd
  }
  try {
    await ensurePlatformSchool()
    await db.aIUsageLog.create({
      data: {
        schoolId: PLATFORM_SCHOOL_ID,
        jobType: spent.jobType,
        model: spent.model,
        provider: "anthropic",
        inputTokens: spent.inputTokens,
        outputTokens: spent.outputTokens,
        costUsd: spent.costUsd,
        jobId: spent.jobId,
      },
    })
  } catch (error) {
    console.error("[chatbot] spend not recorded", error)
  }
}

/** The credits or the workspace limit ran out: Groq until next month. */
export function capUntilNextMonth() {
  const now = new Date()
  cappedUntil = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  console.error("[chatbot] Claude capped until", new Date(cappedUntil).toISOString())
}

/** Tests only. */
export function __resetSpend() {
  seed = null
  reserved = 0
  cappedUntil = 0
}
