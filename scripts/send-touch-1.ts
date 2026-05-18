// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Send Touch 1 cold-open email to top-N enriched prospects.
 *
 * Picks prospects where status="enriched", email is set, ordered by
 * enrichmentScore DESC. Sends one at a time with a small gap (Resend free
 * tier is 100/day, so don't burst).
 *
 * Usage:
 *   pnpm tsx scripts/send-touch-1.ts                       # top 25, prod sends to delivered@resend.dev in dev
 *   pnpm tsx scripts/send-touch-1.ts --limit=100
 *   pnpm tsx scripts/send-touch-1.ts --country=SA --dry-run
 *   pnpm tsx scripts/send-touch-1.ts --min-score=60
 */

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { sendOutreachTouch1 } from "@/lib/outreach"

const prisma = new PrismaClient()

function parseArg(name: string, fallback?: string): string | undefined {
  const arg = process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")[1]
  return arg ?? fallback
}

async function main() {
  const limit = Number(parseArg("limit", "25"))
  const minScore = Number(parseArg("min-score", "50"))
  const countryFilter = parseArg("country")?.toUpperCase()
  const dryRun = process.argv.includes("--dry-run")

  const prospects = await prisma.prospect.findMany({
    where: {
      status: "enriched",
      email: { not: null },
      enrichmentScore: { gte: minScore },
      ...(countryFilter ? { country: countryFilter } : {}),
    },
    select: { id: true, name: true, country: true, enrichmentScore: true },
    orderBy: { enrichmentScore: "desc" },
    take: limit,
  })

  console.log(
    `Sending Touch 1 to ${prospects.length} prospects (min-score=${minScore}, dryRun=${dryRun})`
  )

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const p of prospects) {
    const result = await sendOutreachTouch1(p.id, { dryRun })
    if (result.success) {
      sent += 1
      console.log(
        `  ✓ ${p.country}/${p.name} (score ${p.enrichmentScore})${dryRun ? " [dry-run]" : ""}`
      )
    } else if (result.reason === "No email on file") {
      skipped += 1
      console.log(`  - ${p.country}/${p.name} skipped: no email`)
    } else {
      failed += 1
      console.error(`  ✗ ${p.country}/${p.name}: ${result.reason}`)
    }
    // 250ms between sends -- gentle on Resend rate limits
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
