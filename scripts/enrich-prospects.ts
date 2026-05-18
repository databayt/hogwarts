// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Enrich Prospect rows via Anthropic Claude.
 *
 * Picks rows with status="new", calls enrichProspect, computes the deterministic
 * score, writes back to DB with status="enriched".
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... pnpm tsx scripts/enrich-prospects.ts
 *   ANTHROPIC_API_KEY=... pnpm tsx scripts/enrich-prospects.ts --limit=50
 *   ANTHROPIC_API_KEY=... pnpm tsx scripts/enrich-prospects.ts --country=SA --concurrency=3
 */

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import {
  computeEnrichmentScore,
  enrichProspect,
  type EnrichmentInput,
} from "@/lib/ai/enrich-prospect"

const prisma = new PrismaClient()

function parseArg(name: string, fallback?: string): string | undefined {
  const arg = process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")[1]
  return arg ?? fallback
}

async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = []
  let cursor = 0
  const runners = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index])
    }
  })
  await Promise.all(runners)
  return results
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY")
    process.exit(1)
  }

  const limit = Number(parseArg("limit", "100"))
  const concurrency = Number(parseArg("concurrency", "5"))
  const countryFilter = parseArg("country")?.toUpperCase()

  const prospects = await prisma.prospect.findMany({
    where: {
      status: "new",
      ...(countryFilter ? { country: countryFilter } : {}),
    },
    take: limit,
    orderBy: { scrapedAt: "asc" },
  })

  console.log(
    `Enriching ${prospects.length} prospects (concurrency=${concurrency})`
  )

  let ok = 0
  let failed = 0

  await runWithConcurrency(
    prospects,
    async (p) => {
      const input: EnrichmentInput = {
        name: p.name,
        country: p.country,
        city: p.city,
        website: p.website,
        address: p.address,
        phone: p.phone,
        social: {
          instagram: p.instagramHandle,
          facebook: p.facebookHandle,
        },
        gmapsRating: p.gmapsRating,
      }

      try {
        const enriched = await enrichProspect(input)

        const reachability: "email" | "phone" | "social" =
          enriched.bestEmailGuess ? "email" : p.phone ? "phone" : "social"

        const score = computeEnrichmentScore({
          studentCount: enriched.studentCountEstimate,
          language: enriched.primaryLanguage,
          reachability,
          country: p.country,
          tierLikelihood: enriched.tierLikelihood,
        })

        await prisma.prospect.update({
          where: { id: p.id },
          data: {
            email: p.email ?? enriched.bestEmailGuess,
            emailConfidence: enriched.emailConfidence,
            language: enriched.primaryLanguage,
            tierGuess: enriched.tier,
            tierLikelihood: enriched.tierLikelihood,
            decisionMakerRole: enriched.decisionMakerRole,
            pitchHook: enriched.pitchHook,
            studentCountEstimate: enriched.studentCountEstimate,
            enrichmentScore: score,
            status: "enriched",
            enrichedAt: new Date(),
          },
        })

        ok += 1
        console.log(`  ✓ ${p.country}/${p.name} → score ${score}`)
      } catch (err) {
        failed += 1
        console.error(
          `  ✗ ${p.country}/${p.name}: ${(err as Error).message.slice(0, 120)}`
        )
      }
    },
    concurrency
  )

  console.log(`\nDone. ok=${ok} failed=${failed}`)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
