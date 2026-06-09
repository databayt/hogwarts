// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * CBSE (India / NCERT) — seeded from the `curriculum/in/` tree (structure.json
 * authored from the official NCERT chapter lists), via the shared tree engine.
 * Free official textbooks (NCERT, ncert.nic.in) attach as `Subject.pdf` once
 * fetched into the tree.
 *
 * Usage: pnpm db:seed:single cbse
 */

import type { PrismaClient } from "@prisma/client"

import { syncCurriculumTree } from "./engine"

export async function seedCbseCurriculum(prisma: PrismaClient): Promise<void> {
  await syncCurriculumTree(prisma, {
    dir: "in",
    country: "IN",
    code: "CBSE",
    slugPrefix: "cbse",
    name: "Indian CBSE (NCERT)",
    lang: "en",
    sortBase: 22000,
  })
}
