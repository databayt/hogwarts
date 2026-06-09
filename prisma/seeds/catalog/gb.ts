// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * GB (England National Curriculum) — seeded from the authored `curriculum/uk/`
 * tree (184 subjects / 363 chapters / 730 lessons), via the shared tree engine.
 * Replaces the old subjects-only `BRITISH` block in world.ts.
 *
 * Usage: pnpm db:seed:single gb
 */

import type { PrismaClient } from "@prisma/client"

import { syncCurriculumTree } from "./engine"

export async function seedGbCurriculum(prisma: PrismaClient): Promise<void> {
  await syncCurriculumTree(prisma, {
    dir: "uk",
    country: "GB",
    code: "GB",
    slugPrefix: "gb",
    name: "England National Curriculum",
    lang: "en",
    sortBase: 20000,
  })
}
