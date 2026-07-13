// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Prune stale rows from the Translation cache (table `translation_cache`).
 *
 * MANUAL-RUN ONLY. This is intentionally NOT wired to any cron — translation
 * rows are cheap to keep and re-derivable, so eviction is an occasional
 * housekeeping chore, not an automated one.
 *
 *   pnpm i18n:prune                       # DRY RUN (default), 6 months, counts only
 *   pnpm i18n:prune -- --months 12        # DRY RUN, custom window
 *   pnpm i18n:prune -- --execute          # actually delete (6 months)
 *   pnpm i18n:prune -- --months 12 --execute
 *
 * WHAT IT DELETES — and why these exact predicates:
 *
 *   provider != "manual"  AND  hitCount = 0  AND  createdAt < cutoff
 *
 * - provider != "manual": only auto-generated rows ("google", "groq", "auto"
 *   from the engine/sweep). Manual overrides (provider:"manual") are NEVER
 *   touched — a human wrote those and re-translating would silently lose the
 *   correction.
 * - hitCount = 0: only rows that were prewarmed/seeded but never actually
 *   served from cache. A row with hits has proven it's worth keeping.
 * - createdAt (NOT lastAccessedAt): keyed on AGE, never on recency. This is the
 *   load-bearing decision. `localize()` reads the cache via a single batched
 *   `findMany` and deliberately does NOT bump `lastAccessedAt` on the read path
 *   (bumping it would mean a write on every render). So `lastAccessedAt` for the
 *   HOTTEST rows still reads as "ancient" — a recency-keyed eviction would
 *   delete exactly the rows under heaviest read load. Age + zero-hits is the
 *   only safe signal for "born, never used, old enough to forget".
 *
 * Deletes in bounded batches (findMany ids -> deleteMany by id) so a large
 * sweep never issues one unbounded statement.
 */
import { Command } from "commander"

const PROTECTED_PROVIDER = "manual" as const
const BATCH_SIZE = 1000

/** Cutoff = `months` calendar months before `now`. */
export function pruneCutoff(months: number, now: Date = new Date()): Date {
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - months)
  return cutoff
}

/**
 * Prune predicate: auto-generated (non-manual), never-hit, older than cutoff.
 * Manual overrides and any row that has ever been served are excluded.
 */
export function pruneWhere(cutoff: Date) {
  return {
    provider: { not: PROTECTED_PROVIDER },
    hitCount: 0,
    createdAt: { lt: cutoff },
  } as const
}

async function main(opts: { months: string; execute?: boolean }) {
  const months = Number(opts.months)
  if (!Number.isFinite(months) || months < 1) {
    console.error("--months must be a number >= 1 (refusing aggressive prunes)")
    process.exit(1)
  }
  const dryRun = !opts.execute

  // Lazy import so the pure helpers above are testable without a DB client.
  const { db } = await import("../src/lib/db")

  const cutoff = pruneCutoff(months)
  const where = pruneWhere(cutoff)

  try {
    const matched = await db.translation.count({ where })
    console.log(
      `Translation cache prune (${months} month${months === 1 ? "" : "s"}):`
    )
    console.log(
      `  matched: ${matched} rows  ` +
        `[provider!="manual", hitCount=0, createdAt < ${cutoff.toISOString().slice(0, 10)}]`
    )

    if (dryRun) {
      console.log(
        `  DRY RUN — deleted nothing. Re-run with --execute to delete these ${matched} rows.`
      )
      return
    }

    // Delete in bounded batches. `deleteMany` has no `take`, so we page ids via
    // `findMany` and delete by id until nothing matches.
    let deleted = 0
    for (;;) {
      const batch = await db.translation.findMany({
        where,
        select: { id: true },
        take: BATCH_SIZE,
      })
      if (batch.length === 0) break
      const { count } = await db.translation.deleteMany({
        where: { id: { in: batch.map((r) => r.id) } },
      })
      deleted += count
      if (batch.length < BATCH_SIZE) break
    }

    console.log(`  deleted: ${deleted} rows.`)
  } finally {
    await db.$disconnect()
  }
}

// CLI guard: argv parsing stays out of module scope so importing the pure
// helpers from vitest never touches commander or the DB.
if (process.argv[1]?.endsWith("prune-translation-cache.ts")) {
  const program = new Command()
  program
    .option("--months <n>", "delete google rows older than N months", "6")
    .option(
      "--execute",
      "actually delete (default is a dry run that only counts)"
    )
    .parse()

  main(program.opts()).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
