// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cambridge IGCSE (CAIE) — seeded from the `curriculum/caie-igcse/` tree
 * (structure authored from the official Cambridge IGCSE syllabus topic lists),
 * via the shared tree engine. Transnational + opt-in (like IB) — a school adopts
 * it explicitly, not by country. Textbooks are commercial (publisher-owned) →
 * structure-only; no textbook.pdf.
 *
 * Usage: pnpm db:seed:single caie-igcse
 */

import type { PrismaClient } from "@prisma/client"

import { syncCurriculumTree } from "./engine"

export async function seedCaieIgcseCurriculum(
  prisma: PrismaClient
): Promise<void> {
  await syncCurriculumTree(prisma, {
    dir: "caie-igcse",
    country: "*",
    code: "CAIE-IGCSE",
    slugPrefix: "caie",
    name: "Cambridge IGCSE",
    lang: "en",
    sortBase: 24000,
  })
}
