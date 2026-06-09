// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog orchestrator.
 *
 * - `seedCatalog`      — fast default: US + full Sudan, registered. Kept thin so
 *                        existing `pnpm db:seed:single catalog` calls still work.
 * - `seedFullCatalog`  — everything: all 12 curricula → registry (links
 *                        curriculumId) → shared concept images.
 *
 * Seed order lives as data in SOURCES, so adding a national (eg.ts → ae.ts …)
 * is a one-line edit. Per-source files only write the `curriculum` code onto
 * subjects; `registry.ts` owns the Curriculum records and the FK backfill.
 */

import type { PrismaClient } from "@prisma/client"

import type { SubjectRef } from "../types"
import { logSuccess } from "../utils"
import { seedAeCurriculum } from "./ae"
import { seedConceptBanners } from "./banners"
import { seedCaieIgcseCurriculum } from "./caie-igcse"
import { seedCbseCurriculum } from "./cbse"
import { seedConceptImages } from "./concepts"
import { seedEgCurriculum } from "./eg"
import { seedGbCurriculum } from "./gb"
import { seedIbCurriculum } from "./ib"
import { seedJoCurriculum } from "./jo"
import { seedKwCurriculum } from "./kw"
import { seedQaCurriculum } from "./qa"
import { seedCurriculumRegistry } from "./registry"
import { seedSaCurriculum } from "./sa"
import { seedSdCurriculum } from "./sd"
import { seedUsCurriculum } from "./us"

// Canonical seed order: deep sources first, then the subjects-only nationals.
const SOURCES = [
  seedUsCurriculum,
  seedSdCurriculum,
  seedGbCurriculum,
  seedCbseCurriculum,
  seedCaieIgcseCurriculum,
  seedIbCurriculum,
  seedSaCurriculum,
  seedEgCurriculum,
  seedAeCurriculum,
  seedQaCurriculum,
  seedKwCurriculum,
  seedJoCurriculum,
]

/** Fast default: US + full Sudan, then link curriculumId. */
export async function seedCatalog(prisma: PrismaClient): Promise<SubjectRef[]> {
  await seedUsCurriculum(prisma)
  await seedSdCurriculum(prisma)
  await seedCurriculumRegistry(prisma)
  return publishedSubjects(prisma)
}

/** Everything: all 12 curricula → registry → shared concept images. */
export async function seedFullCatalog(
  prisma: PrismaClient
): Promise<SubjectRef[]> {
  for (const seed of SOURCES) await seed(prisma)
  await seedCurriculumRegistry(prisma)
  await seedConceptImages(prisma)
  await seedConceptBanners()
  return publishedSubjects(prisma)
}

async function publishedSubjects(prisma: PrismaClient): Promise<SubjectRef[]> {
  const subjects = await prisma.subject.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: "asc" },
  })

  logSuccess("Subjects", subjects.length, "catalog")

  return subjects.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))
}
