// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Rewrites the handful of demo-student fields that were seeded in English into
 * the school's own content language.
 *
 * Content is stored in ONE language (Arabic for these schools) and translated on
 * demand — so an English string in a content column renders verbatim on the
 * Arabic page and never reaches the translation chain. The Harry Potter demo
 * student carried three of them: his home town, his address, and a medical note.
 *
 * `prisma/seeds/` now writes these in Arabic, but a seed only runs against a
 * fresh database, so any environment seeded before 2026-09-12 needs this pass.
 * It matches on the exact English values, so it is safe to re-run and a no-op
 * once applied.
 *
 *   DIRECT_URL=<prod> npx tsx -r dotenv/config prisma/scripts/translate-seeded-english.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
  },
})

const REWRITES = [
  { field: "city", from: "Little Whinging", to: "ليتل وينجينج" },
  {
    field: "currentAddress",
    from: "4 Privet Drive, Little Whinging",
    to: "4 برايفت درايف، ليتل وينجينج",
  },
  {
    field: "medicalConditions",
    from: "Lightning bolt scar on forehead",
    to: "ندبة على شكل صاعقة في الجبهة",
  },
] as const

async function main() {
  for (const { field, from, to } of REWRITES) {
    const { count } = await prisma.student.updateMany({
      where: { [field]: from } as never,
      data: { [field]: to } as never,
    })
    console.log(`${field}: ${count} row(s)`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
