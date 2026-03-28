// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog Seed
 *
 * Seeds US K-12 subjects from the ClickView inventory.
 * Sudanese national curriculum removed -- will be re-added as a separate
 * curriculum set in the future.
 *
 * Kept as a thin wrapper so existing `pnpm db:seed:single catalog`
 * and `index.ts` calls still work.
 */

import type { PrismaClient } from "@prisma/client"

import { seedSudanCatalog } from "./sd-catalog"
import type { SubjectRef } from "./types"
import { seedUsCatalog } from "./us-catalog"
import { logSuccess } from "./utils"

export async function seedCatalog(prisma: PrismaClient): Promise<SubjectRef[]> {
  // US K-12 curriculum
  await seedUsCatalog(prisma)

  // Sudan national curriculum
  await seedSudanCatalog(prisma)

  // Return all published subjects for downstream consumers
  const subjects = await prisma.subject.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: "asc" },
  })

  logSuccess("Subjects", subjects.length, "catalog")

  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
  }))
}
