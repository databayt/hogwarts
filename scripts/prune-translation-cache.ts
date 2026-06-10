// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Prune stale rows from the Translation cache (table `translation_cache`).
 *
 * Cache rows are keyed by exact sourceText, so edited-away content leaves
 * orphan rows forever — they're harmless but accumulate. This deletes rows
 * not read since the cutoff, using the existing `lastAccessedAt` index.
 * Manual-run only (no cron):
 *
 *   pnpm i18n:prune -- --dry-run          # count only, delete nothing
 *   pnpm i18n:prune                       # default: 180 days
 *   pnpm i18n:prune -- --days 90
 *
 * Manual overrides (provider:"manual") are NEVER deleted — a human wrote
 * those translations and re-translating would lose the correction.
 */
import { Command } from "commander"

export function pruneCutoff(days: number, now: Date = new Date()): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export function pruneWhere(cutoff: Date) {
  return {
    lastAccessedAt: { lt: cutoff },
    provider: { not: "manual" },
  } as const
}

async function main(opts: { days: string; dryRun?: boolean }) {
  const days = Number(opts.days)
  if (!Number.isFinite(days) || days < 7) {
    console.error("--days must be a number >= 7 (refusing aggressive prunes)")
    process.exit(1)
  }

  // Lazy import so the pure helpers above are testable without a DB client.
  const { db } = await import("../src/lib/db")

  const cutoff = pruneCutoff(days)
  const where = pruneWhere(cutoff)

  try {
    const stale = await db.translation.count({ where })
    const total = await db.translation.count()
    console.log(
      `Translation cache: ${total} rows, ${stale} not accessed since ${cutoff.toISOString().slice(0, 10)} (${days}d)`
    )

    if (opts.dryRun) {
      console.log("Dry run — nothing deleted.")
      return
    }

    const { count } = await db.translation.deleteMany({ where })
    console.log(`Deleted ${count} stale rows.`)
  } finally {
    await db.$disconnect()
  }
}

// CLI guard: argv parsing stays out of module scope so importing the pure
// helpers from vitest never touches commander or the DB.
if (process.argv[1]?.endsWith("prune-translation-cache.ts")) {
  const program = new Command()
  program
    .option("--days <n>", "delete rows not accessed in N days", "180")
    .option("--dry-run", "report what would be deleted, delete nothing")
    .parse()

  main(program.opts()).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
