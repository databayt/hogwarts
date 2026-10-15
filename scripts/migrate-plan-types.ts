// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Rewrite School.planType to the public pricing ids — free | pro | enterprise.
 *
 * Pre-2026-10 rows carry `basic` / `premium`, the even older `trial` /
 * `starter`, and mixed casing (`BASIC` from the old operator path). Every
 * reader already maps them through `normalizePlanType`, so this script only
 * makes the stored data match; nothing breaks if it never runs.
 *
 * Mapping (src/lib/plan-type.ts, LEGACY_PLAN_TYPES):
 *   basic, trial, starter, hobby → free
 *   premium, professional        → pro
 *   ultra                        → enterprise
 *   FREE / Pro / …               → lowercase id
 * Unknown values are reported and left untouched.
 *
 * DRY RUN BY DEFAULT — prints the count per stored value and what it would
 * become. Nothing is written without --apply. Take a Neon restore point first.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-plan-types.ts           # dry run (default)
 *   pnpm tsx scripts/migrate-plan-types.ts --apply   # write
 */

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import {
  isKnownPlanType,
  normalizePlanType,
  PLAN_TYPES,
  type PlanType,
} from "../src/lib/plan-type"

const apply = process.argv.includes("--apply")
const prisma = new PrismaClient()

async function main() {
  const groups = await prisma.school.groupBy({
    by: ["planType"],
    _count: { _all: true },
  })

  const plan: Array<{ from: string; to: PlanType; count: number }> = []
  const unknown: Array<{ value: string; count: number }> = []

  console.log(`\nSchool.planType — ${apply ? "APPLY" : "DRY RUN"}\n`)
  for (const g of groups.sort((a, b) => b._count._all - a._count._all)) {
    const value = g.planType
    const count = g._count._all
    if ((PLAN_TYPES as readonly string[]).includes(value)) {
      console.log(`  ${value.padEnd(14)} ${String(count).padStart(5)}  ok`)
    } else if (isKnownPlanType(value)) {
      const to = normalizePlanType(value)
      plan.push({ from: value, to, count })
      console.log(`  ${value.padEnd(14)} ${String(count).padStart(5)}  → ${to}`)
    } else {
      unknown.push({ value, count })
      console.log(
        `  ${value.padEnd(14)} ${String(count).padStart(5)}  UNKNOWN — left as is`
      )
    }
  }

  const total = plan.reduce((n, p) => n + p.count, 0)
  console.log(
    `\n${total} row(s) to rewrite, ${unknown.length} unknown value(s).`
  )

  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply to write.\n")
    return
  }

  for (const p of plan) {
    const res = await prisma.school.updateMany({
      where: { planType: p.from },
      data: { planType: p.to },
    })
    console.log(`  ${p.from} → ${p.to}: ${res.count} updated`)
  }
  console.log("Done.\n")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
