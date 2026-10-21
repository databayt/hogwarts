// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Chatbot Retention
 *
 * Anonymous visitors' chats are kept 90 days from their last message, then
 * deleted with everything under them — profile, threads, messages, learned
 * notes (FK cascade). Members' chats stay until they delete them. The
 * assistant guide (`content/docs-*\/support/assistant.mdx`) promises this.
 *
 * TRIGGER: Daily at 2:00 AM (0 2 * * *), beside purge-empty-drafts — an
 * existing schedule, because a new cron trigger takes about a day to start
 * firing on the container Worker.
 *
 * RULES:
 * - Visitor profiles only (`keyHash` set); a member's profile has a userId.
 * - In batches of 1,000, so one run never holds a long lock.
 * - Cross-tenant on purpose (a system sweep); `?dryRun=1` only counts.
 */

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { VISITOR_TTL_DAYS } from "@/components/chatbot/identity"

const BATCH = 1000
const MAX_BATCHES = 50

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  const cutoff = new Date(startTime - VISITOR_TTL_DAYS * 24 * 60 * 60 * 1000)

  try {
    if (request.nextUrl.searchParams.get("dryRun") === "1") {
      const [row] = await db.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*)::bigint AS count FROM chatbot_profiles
        WHERE "keyHash" IS NOT NULL AND "lastSeenAt" < ${cutoff}`
      return NextResponse.json({
        success: true,
        dryRun: true,
        wouldDelete: Number(row?.count ?? 0),
        cutoff: cutoff.toISOString(),
      })
    }

    let deleted = 0
    for (let i = 0; i < MAX_BATCHES; i++) {
      const count = await db.$executeRaw`
        DELETE FROM chatbot_profiles WHERE id IN (
          SELECT id FROM chatbot_profiles
          WHERE "keyHash" IS NOT NULL AND "lastSeenAt" < ${cutoff}
          LIMIT ${BATCH})`
      deleted += count
      if (count < BATCH) break
    }

    return NextResponse.json({
      success: true,
      deleted: { visitorProfiles: deleted },
      cutoff: cutoff.toISOString(),
      durationMs: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[cron] chatbot-retention failed", error)
    return NextResponse.json(
      { success: false, error: "retention sweep failed" },
      { status: 500 }
    )
  }
}
