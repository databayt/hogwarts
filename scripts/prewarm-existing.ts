// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Backfill the Translation cache for EXISTING rows — CLI over the shared
 * sweep core (src/components/translation/sweep.ts, also used by the daily
 * /api/cron/translation-sweep self-heal).
 *
 *   pnpm i18n:backfill                          # DRY RUN (default): counts + chars + ~cost
 *   pnpm i18n:backfill -- --school demo         # one school (subdomain)
 *   pnpm i18n:backfill -- --school demo,qdwa    # several schools, one process
 *   pnpm i18n:backfill -- --model Announcement  # one registered model
 *   pnpm i18n:backfill -- --no-names            # skip person names
 *   pnpm i18n:backfill -- --max 2000            # cap provider calls this run
 *   pnpm i18n:backfill -- --execute             # actually translate + cache
 *
 * Semantics (enforced by the core):
 * - Models/fields come from the registry (TRANSLATABLE) — the same single
 *   source of truth localize()/prewarm() read. Person names (students /
 *   teachers / guardians / staff) are swept too, as composed full names —
 *   exactly the strings getNames() looks up at render time.
 * - Direction is per-value script-truth (detectScript), same as the engine, so
 *   cache keys line up exactly with what localize() will look for.
 * - CATALOG_GLOBAL models (no schoolId column) are fetched ONCE but warmed
 *   PER SCHOOL — the cache is tenant-scoped, so global content costs
 *   rows × schools. The dry run surfaces that multiplier before you pay it.
 * - CREATE-ONLY: existing cache rows (including provider:"manual" overrides)
 *   are never overwritten — we check the cache first and translate misses only.
 * - Provider chain: Google first, Groq LLM fallback (engine.ts) — the sweep
 *   works even while the Google quota is dead.
 * - Batch errors are logged and skipped; the sweep never aborts mid-run.
 */
import "dotenv/config"

import { Command } from "commander"

import {
  TRANSLATABLE,
  type TranslatableModel,
} from "../src/components/translation/registry"

// Google Cloud Translation v2 list price per 1M characters (USD).
const COST_PER_MILLION_CHARS = 20

async function main(opts: {
  execute?: boolean
  school?: string
  model?: string
  names?: boolean
  allSchools?: boolean
  max?: string
  throttle?: string
}) {
  const dryRun = !opts.execute
  // Lazy imports so arg parsing/help never needs a DB client or API key.
  const { db } = await import("../src/lib/db")
  const { sweepTranslations } =
    await import("../src/components/translation/sweep")
  const { getTranslationEngineState } =
    await import("../src/components/translation/engine")

  if (opts.model && !(opts.model in TRANSLATABLE)) {
    console.error(
      `--model "${opts.model}" is not in the registry. Registered: ${Object.keys(TRANSLATABLE).join(", ")}`
    )
    process.exit(1)
  }

  try {
    console.log(`Translation backfill ${dryRun ? "(DRY RUN)" : "(EXECUTE)"}\n`)

    const result = await sweepTranslations({
      schoolDomains: opts.school
        ? opts.school.split(",").map((s) => s.trim())
        : undefined,
      includeAllSchools: opts.allSchools,
      models: opts.model ? [opts.model as TranslatableModel] : undefined,
      includeNames: opts.names !== false && !opts.model,
      translate: !dryRun,
      maxTranslations: opts.max ? Number(opts.max) : undefined,
      // Default paced for Groq's free-tier 6k tokens/min window (~50-string
      // chunks ≈ 1.2k tokens); the sweep's adaptive pacing absorbs the rest.
      throttleMs: opts.throttle ? Number(opts.throttle) : 4_000,
      log: (msg) => console.log(msg),
    })

    if (result.schools === 0) {
      console.error(
        opts.school
          ? `No school with subdomain "${opts.school}".`
          : "No schools found."
      )
      process.exit(1)
    }

    // Report
    console.log(
      "\nschool/model                          rows   unique    chars"
    )
    for (const s of result.units) {
      console.log(
        `  ${`${s.school}/${s.model}`.padEnd(36)}${String(s.rows).padStart(5)}  ${String(s.unique).padStart(7)}  ${String(s.chars).padStart(7)}`
      )
    }
    const cost = (result.chars / 1_000_000) * COST_PER_MILLION_CHARS
    console.log(
      `\nTOTAL: ${result.chars.toLocaleString()} chars ≈ $${cost.toFixed(2)} ` +
        `if all served by Google v2 @ $${COST_PER_MILLION_CHARS}/1M chars ` +
        `(cache hits + Groq fallback cost nothing)`
    )
    if (result.longSkipped > 0) {
      console.log(
        `Skipped ${result.longSkipped} values >1500 chars (translated on demand at read time).`
      )
    }
    if (dryRun) {
      console.log("DRY RUN — nothing translated. Re-run with --execute.")
    } else {
      console.log(
        `Cache misses found: ${result.misses} — sent ${result.translated} strings ` +
          `to providers, wrote ${result.written} new cache rows, ${result.errors} batch errors.`
      )
      const state = getTranslationEngineState()
      console.log(
        `Engine state: google=${state.google.state} groq=${state.groq.state}`
      )
      if (result.exhausted) {
        console.log(
          "⚠️  Budget cap hit — re-run to continue where it left off."
        )
      }
    }
  } finally {
    await db.$disconnect()
  }
}

const program = new Command()
program
  .option(
    "--execute",
    "actually translate and write cache rows (default: dry run)"
  )
  .option(
    "--school <subdomains>",
    "limit to school subdomain(s), comma-separated"
  )
  .option(
    "--model <Model>",
    "limit to one registered model (e.g. Announcement)"
  )
  .option("--no-names", "skip person-name sweep")
  .option("--all-schools", "include seed/test tenants")
  .option("--max <n>", "cap strings sent to providers this run")
  .option("--throttle <ms>", "sleep between provider calls (default 4000)")
  .action(main)
program.parse()
