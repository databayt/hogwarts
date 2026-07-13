// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Translation-Cache Self-Heal Sweep
 *
 * Daily bounded run of the registry-driven sweep
 * (src/components/translation/sweep.ts — same core as `pnpm i18n:backfill`).
 *
 * WHY A CRON:
 * prewarm-on-write covers content created through app actions, and the read
 * path caches on first view — but three real gaps kept resurfacing as
 * "database content is not translated":
 *   1. New schools: provisioning creates grades/classes/catalog links outside
 *      request scope (no prewarm), so a fresh tenant starts 100% uncached.
 *   2. Content imported/seeded directly into the DB (bulk import, seeds).
 *   3. Provider outages: while Google quota was dead (2026-06-14 → 2026-07-12)
 *      NOTHING got cached — this sweep re-heals the backlog automatically
 *      once any provider works again.
 *
 * BOUNDED: maxTranslations + deadline keep each run inside the function
 * window; `exhausted: true` simply means tomorrow's run continues the walk.
 * Cache-hit-only runs (the steady state) cost zero provider calls.
 *
 * EXECUTION: verify CRON_SECRET → sweep with caps → report stats.
 */
import { NextRequest, NextResponse } from "next/server"

import { getTranslationEngineState } from "@/components/translation/engine"
import { sweepTranslations } from "@/components/translation/sweep"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("[translation-sweep] CRON_SECRET not configured")
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sweepTranslations({
      translate: true,
      // Leave headroom for the final createMany inside the 300s window.
      deadlineMs: 240_000,
      // Steady-state runs find ~0 misses; a fresh school's first sweep is
      // capped here and finishes over the following nights.
      maxTranslations: 2_000,
      throttleMs: 250,
      log: (msg) => console.log(`[translation-sweep]${msg}`),
    })

    console.log(
      `[translation-sweep] schools=${result.schools} misses=${result.misses} ` +
        `translated=${result.translated} written=${result.written} ` +
        `errors=${result.errors} exhausted=${result.exhausted}`
    )

    return NextResponse.json({
      success: true,
      schools: result.schools,
      misses: result.misses,
      translated: result.translated,
      written: result.written,
      errors: result.errors,
      exhausted: result.exhausted,
      engine: getTranslationEngineState(),
    })
  } catch (error) {
    console.error("[translation-sweep] failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sweep failed" },
      { status: 500 }
    )
  }
}
