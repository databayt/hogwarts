// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Send any touch (1-5) in the cold cadence to eligible prospects.
 *
 * Selection logic per touch number:
 *   1 → status="enriched", lastTouchNumber NULL
 *   2 → lastTouchNumber=1, lastTouchAt < now - 3 days
 *   3 → lastTouchNumber=2, lastTouchAt < now - 4 days
 *   4 → lastTouchNumber=3, lastTouchAt < now - 6 days
 *   5 → lastTouchNumber=4, lastTouchAt < now - 7 days
 *
 * Always excludes status in ("replied", "promoted", "dead").
 *
 * Usage:
 *   pnpm tsx scripts/send-touch.ts --touch=1                 # top 25 eligible for Touch 1
 *   pnpm tsx scripts/send-touch.ts --touch=2 --limit=50
 *   pnpm tsx scripts/send-touch.ts --touch=3 --country=SA --dry-run
 *   pnpm tsx scripts/send-touch.ts --touch=4 --min-score=70
 */

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { sendOutreachTouch, type TouchNumber } from "@/lib/outreach"

const prisma = new PrismaClient()

function parseArg(name: string, fallback?: string): string | undefined {
  const arg = process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")[1]
  return arg ?? fallback
}

const COOLDOWN_DAYS: Record<TouchNumber, number> = {
  1: 0,
  2: 3,
  3: 4,
  4: 6,
  5: 7,
}

const EXCLUDED_STATUSES = ["replied", "promoted", "dead"]

async function findEligibleProspects(args: {
  touch: TouchNumber
  limit: number
  minScore: number
  country?: string
}) {
  const cooldownMs = COOLDOWN_DAYS[args.touch] * 24 * 60 * 60 * 1000
  const cutoff = new Date(Date.now() - cooldownMs)

  const statusFilter =
    args.touch === 1
      ? { status: "enriched" }
      : { status: { notIn: EXCLUDED_STATUSES } }

  const touchFilter =
    args.touch === 1
      ? { lastTouchNumber: null }
      : { lastTouchNumber: args.touch - 1, lastTouchAt: { lt: cutoff } }

  return prisma.prospect.findMany({
    where: {
      email: { not: null },
      enrichmentScore: { gte: args.minScore },
      ...statusFilter,
      ...touchFilter,
      ...(args.country ? { country: args.country } : {}),
    },
    select: {
      id: true,
      name: true,
      country: true,
      enrichmentScore: true,
    },
    orderBy: { enrichmentScore: "desc" },
    take: args.limit,
  })
}

async function main() {
  const touch = Number(parseArg("touch")) as TouchNumber
  if (![1, 2, 3, 4, 5].includes(touch)) {
    console.error("Missing or invalid --touch (must be 1..5)")
    process.exit(1)
  }
  const limit = Number(parseArg("limit", "25"))
  const minScore = Number(parseArg("min-score", "50"))
  const country = parseArg("country")?.toUpperCase()
  const dryRun = process.argv.includes("--dry-run")

  const prospects = await findEligibleProspects({
    touch,
    limit,
    minScore,
    country,
  })

  console.log(
    `Touch ${touch} → ${prospects.length} eligible prospects ` +
      `(min-score=${minScore}, country=${country ?? "ANY"}, dryRun=${dryRun})`
  )

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const p of prospects) {
    const result = await sendOutreachTouch(p.id, touch, { dryRun })
    if (result.success) {
      sent += 1
      console.log(
        `  ✓ T${touch} ${p.country}/${p.name} (score ${p.enrichmentScore})${dryRun ? " [dry-run]" : ""}`
      )
    } else if (result.reason === "No email on file") {
      skipped += 1
      console.log(`  - skipped ${p.country}/${p.name}: no email`)
    } else {
      failed += 1
      console.error(`  ✗ ${p.country}/${p.name}: ${result.reason}`)
    }
    // 250ms gap -- gentle on Resend rate limits
    await new Promise((r) => setTimeout(r, 250))
  }

  console.log(`\nDone. sent=${sent} skipped=${skipped} failed=${failed}`)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
