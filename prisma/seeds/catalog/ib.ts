// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * IB Diploma Programme — seeded from the `curriculum/ib/` tree (structure
 * authored from the IB DP subject guides), via the shared tree engine.
 * Transnational + opt-in. Replaces the old subjects-only IB block in world.ts.
 * Textbooks are commercial → structure-only.
 *
 * Usage: pnpm db:seed:single ib
 */

import type { PrismaClient } from "@prisma/client"

import { syncCurriculumTree } from "./engine"

export async function seedIbCurriculum(prisma: PrismaClient): Promise<void> {
  await syncCurriculumTree(prisma, {
    dir: "ib",
    country: "*",
    code: "IB-DP",
    slugPrefix: "ib",
    name: "International Baccalaureate (Diploma Programme)",
    lang: "en",
    sortBase: 26000,
  })
}
