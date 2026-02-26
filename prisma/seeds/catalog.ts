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

import { seedClickViewCatalog } from "./clickview-catalog"
import type { CatalogSubjectRef } from "./types"
import { logSuccess } from "./utils"

export async function seedCatalog(
  prisma: PrismaClient
): Promise<CatalogSubjectRef[]> {
  // US K-12 curriculum (ClickView-inspired)
  await seedClickViewCatalog(prisma)

  // Return all published subjects for downstream consumers
  const subjects = await prisma.catalogSubject.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: "asc" },
  })

  logSuccess("CatalogSubjects", subjects.length, "US K-12 catalog")

  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
  }))
}
