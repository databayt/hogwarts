// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Backfill the Translation cache for EXISTING rows (the deploy-time sweep).
 *
 * MANUAL-RUN ONLY — never wired to cron, never run by agents. Run it once at
 * deploy (per the rollout plan) so content written BEFORE prewarm-on-write was
 * wired reads seamlessly in both languages from day one. Without it, the first
 * cross-language reader of each old row pays one bounded Google round-trip
 * (then it's cached forever) — the sweep simply front-loads that cost.
 *
 *   pnpm i18n:backfill                          # DRY RUN (default): counts + chars + ~cost
 *   pnpm i18n:backfill -- --school demo         # one school (subdomain)
 *   pnpm i18n:backfill -- --model Announcement  # one registered model
 *   pnpm i18n:backfill -- --execute             # actually translate + cache
 *
 * Semantics:
 * - Models/fields come from the registry (TRANSLATABLE) — the same single
 *   source of truth localize()/prewarm() read.
 * - Direction is per-value script-truth (detectScript), same as the engine, so
 *   cache keys line up exactly with what localize() will look for.
 * - CATALOG_GLOBAL models (no schoolId column) are fetched ONCE but warmed
 *   PER SCHOOL — the cache is tenant-scoped, so global content costs
 *   rows × schools. The dry run surfaces that multiplier before you pay it.
 * - CREATE-ONLY: existing cache rows (including provider:"manual" overrides)
 *   are never overwritten — we check the cache first and translate misses only.
 * - Batch errors are logged and skipped; the sweep never aborts mid-run.
 */
import { Command } from "commander"

import {
  CATALOG_GLOBAL,
  TRANSLATABLE,
  type TranslatableModel,
} from "../src/components/translation/registry"
import { detectScript } from "../src/components/translation/util"

const PAGE_SIZE = 500
const TRANSLATE_CHUNK = 100
// Google Cloud Translation v2 list price per 1M characters (USD).
const COST_PER_MILLION_CHARS = 20

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

interface SweepStat {
  school: string
  model: string
  rows: number
  uniqueStrings: number
  chars: number
}

async function main(opts: {
  execute?: boolean
  school?: string
  model?: string
}) {
  const dryRun = !opts.execute
  // Lazy imports so arg parsing/help never needs a DB client or API key.
  const { db } = await import("../src/lib/db")
  const { translateBatch } =
    await import("../src/components/translation/google")

  const models = (Object.keys(TRANSLATABLE) as TranslatableModel[]).filter(
    (m) => !opts.model || m === opts.model
  )
  if (opts.model && models.length === 0) {
    console.error(
      `--model "${opts.model}" is not in the registry. Registered: ${Object.keys(TRANSLATABLE).join(", ")}`
    )
    process.exit(1)
  }

  try {
    const schools = await db.school.findMany({
      where: opts.school ? { domain: opts.school } : {},
      select: { id: true, domain: true },
      orderBy: { domain: "asc" },
    })
    if (schools.length === 0) {
      console.error(
        opts.school
          ? `No school with subdomain "${opts.school}".`
          : "No schools found."
      )
      process.exit(1)
    }

    console.log(
      `Translation backfill ${dryRun ? "(DRY RUN)" : "(EXECUTE)"} — ` +
        `${schools.length} school(s) × ${models.length} model(s)\n`
    )

    const stats: SweepStat[] = []
    let translatedTotal = 0

    // Catalog-global rows are identical for every school — fetch once, reuse.
    const catalogCache = new Map<string, { values: string[]; rows: number }>()

    for (const school of schools) {
      for (const model of models) {
        const fields = TRANSLATABLE[model] as readonly string[]
        const accessor = lowerFirst(model)
        const delegate = (
          db as unknown as Record<
            string,
            | {
                findMany: (args: object) => Promise<Record<string, unknown>[]>
              }
            | undefined
          >
        )[accessor]
        if (!delegate?.findMany) {
          console.warn(
            `  [skip] db.${accessor} has no findMany — check accessor`
          )
          continue
        }

        const isGlobal = CATALOG_GLOBAL.has(model)
        let values: string[]
        let rowCount: number

        if (isGlobal && catalogCache.has(model)) {
          const cached = catalogCache.get(model)!
          values = cached.values
          rowCount = cached.rows
        } else {
          values = []
          rowCount = 0
          let cursor: string | undefined
          for (;;) {
            let page: Record<string, unknown>[]
            try {
              page = await delegate.findMany({
                where: isGlobal ? {} : { schoolId: school.id },
                select: Object.fromEntries([
                  ["id", true],
                  ...fields.map((f) => [f, true]),
                ]),
                take: PAGE_SIZE,
                orderBy: { id: "asc" },
                ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
              })
            } catch (e) {
              console.warn(
                `  [skip] ${school.domain}/${model} page failed: ${e instanceof Error ? e.message : e}`
              )
              break
            }
            if (page.length === 0) break
            rowCount += page.length
            for (const row of page) {
              for (const f of fields) {
                const v = row[f]
                if (typeof v === "string" && v.trim() !== "") values.push(v)
              }
            }
            cursor = page[page.length - 1].id as string
            if (page.length < PAGE_SIZE) break
          }
          if (isGlobal) catalogCache.set(model, { values, rows: rowCount })
        }

        // Dedupe + group by direction (script-truth, same as the engine).
        const byDirection = new Map<string, Set<string>>()
        for (const v of values) {
          const from = detectScript(v)
          const to = from === "ar" ? "en" : "ar"
          const key = `${from}>${to}`
          if (!byDirection.has(key)) byDirection.set(key, new Set())
          byDirection.get(key)!.add(v)
        }
        const unique = Array.from(byDirection.values()).reduce(
          (n, s) => n + s.size,
          0
        )
        const chars = Array.from(byDirection.values()).reduce(
          (n, s) => n + Array.from(s).reduce((c, v) => c + v.length, 0),
          0
        )
        if (rowCount > 0) {
          stats.push({
            school: school.domain ?? school.id,
            model,
            rows: rowCount,
            uniqueStrings: unique,
            chars,
          })
        }

        if (dryRun || unique === 0) continue

        // EXECUTE: per direction — check cache, translate misses, create-only.
        for (const [dir, set] of byDirection) {
          const [from, to] = dir.split(">") as ["ar" | "en", "ar" | "en"]
          const list = Array.from(set)
          for (let i = 0; i < list.length; i += TRANSLATE_CHUNK) {
            const chunk = list.slice(i, i + TRANSLATE_CHUNK)
            try {
              const existing = await db.translation.findMany({
                where: {
                  schoolId: school.id,
                  sourceLanguage: from,
                  targetLanguage: to,
                  sourceText: { in: chunk },
                },
                select: { sourceText: true },
              })
              const have = new Set(existing.map((r) => r.sourceText))
              const misses = chunk.filter((v) => !have.has(v))
              if (misses.length === 0) continue
              const translations = await translateBatch(misses, from, to, {
                retry: true,
              })
              const rows = misses
                .map((sourceText, j) => ({
                  schoolId: school.id,
                  sourceText,
                  sourceLanguage: from,
                  targetLanguage: to,
                  translatedText: translations[j] ?? "",
                  provider: "google",
                }))
                .filter((r) => r.translatedText !== "")
              if (rows.length > 0) {
                await db.translation.createMany({
                  data: rows,
                  skipDuplicates: true,
                })
                translatedTotal += rows.length
              }
            } catch (e) {
              console.warn(
                `  [batch-error] ${school.domain}/${model} ${dir} @${i}: ${e instanceof Error ? e.message : e} — continuing`
              )
            }
          }
        }
        console.log(
          `  warmed ${school.domain}/${model}: ${unique} unique strings`
        )
      }
    }

    // Report
    console.log(
      "\nschool/model                          rows   unique    chars"
    )
    for (const s of stats) {
      console.log(
        `  ${`${s.school}/${s.model}`.padEnd(36)}${String(s.rows).padStart(5)}  ${String(s.uniqueStrings).padStart(7)}  ${String(s.chars).padStart(7)}`
      )
    }
    const totalChars = stats.reduce((n, s) => n + s.chars, 0)
    const cost = (totalChars / 1_000_000) * COST_PER_MILLION_CHARS
    console.log(
      `\nTOTAL: ${totalChars.toLocaleString()} chars ≈ $${cost.toFixed(2)} ` +
        `(Google v2 @ $${COST_PER_MILLION_CHARS}/1M chars; cache hits cost nothing)`
    )
    if (dryRun) {
      console.log(
        "DRY RUN — nothing translated. Re-run with --execute at deploy."
      )
    } else {
      console.log(`Translated + cached ${translatedTotal} new rows.`)
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
  .option("--school <subdomain>", "limit to one school subdomain")
  .option(
    "--model <Model>",
    "limit to one registered model (e.g. Announcement)"
  )
  .action(main)
program.parse()
