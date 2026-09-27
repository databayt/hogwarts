// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Shared seeding helpers for the shallow national curricula (sa, eg, ae, qa,
 * kw, jo): subjects only, on shared concept art.
 *
 * Deep curricula (subjects → chapters → lessons → questions) are no longer
 * seeded from trees inside this repo — they live in the catalog repository
 * (github.com/databayt/catalog) and `tree.ts` reads them.
 */

import type { PrismaClient, SchoolLevel } from "@prisma/client"

import {
  clickviewConceptKey,
  gradeToLevel as cvGradeToLevel,
} from "../../../src/components/catalog/clickview-key"
import { colorFor } from "../../../src/components/catalog/concepts-data"
import { logSuccess } from "../utils"

/**
 * Flag-gated cutover to the flat `clickview/` CDN key scheme (default OFF keeps
 * the legacy `catalog/concepts/g{grade}-{concept}/...` keys). Flip with CLICKVIEW_KEYS=1.
 */
const USE_CLICKVIEW =
  process.env.CLICKVIEW_KEYS === "1" || process.env.CLICKVIEW_KEYS === "true"

// Re-exported so the national source files keep importing `colorFor` from here.
export { colorFor }

function gradeToLevel(grade: number): SchoolLevel {
  if (grade <= 6) return "ELEMENTARY"
  if (grade <= 9) return "MIDDLE"
  return "HIGH"
}

// ============================================================================
// Shallow nationals (subjects-only)
// ----------------------------------------------------------------------------
// Used by the per-national source files (sa.ts, eg.ts, …). These curricula
// have grade-spanning subjects but no authored chapter/lesson tree yet, so they
// share the concept thumbnails and skip the hierarchy. Each graduates to the
// catalog repo (seeded by tree.ts) once its chapters and lessons are authored.
// Like the deep engine, this does NOT create the Curriculum record — registry.ts
// owns all 12 and backfills curriculumId.
// ============================================================================

export interface CurriculumDef {
  country: string
  code: string
  slug: string
  name: string
  lang: string
  organization?: string
  website?: string
  gradeRange?: string
  structure?: string
  description?: string
}

export interface SubjectDef {
  name: string
  slug: string
  department: string
  concept: string
  color: string
  grades: number[]
}

export interface CurriculumWithSubjects {
  curriculum: CurriculumDef
  subjects: SubjectDef[]
}

// CONCEPT_COLORS + colorFor now live in concepts-data.ts (imported above).

// Sort-order base per country (1000-wide bands) to keep slugs/order stable.
const NATIONAL_SORT_BASE: Record<string, number> = {
  US: 0,
  SD: 1000,
  GB: 2000,
  "*": 3000,
  SA: 4000,
  EG: 5000,
  AE: 6000,
  QA: 7000,
  KW: 8000,
  JO: 9000,
}

export async function seedSubjectsOnly(
  prisma: PrismaClient,
  entry: CurriculumWithSubjects
): Promise<void> {
  const { curriculum: cur, subjects } = entry
  let sortIdx = NATIONAL_SORT_BASE[cur.country] ?? 10000
  let created = 0
  let skipped = 0

  for (const subj of subjects) {
    for (const grade of subj.grades) {
      const slug = `${cur.slug}-g${grade}-${subj.slug}`
      const existing = await prisma.subject.findUnique({
        where: { slug },
        select: { id: true },
      })
      if (existing) {
        skipped++
        continue
      }

      const prefix = `catalog/concepts/g${grade}-${subj.concept}`
      const cvLevel = cvGradeToLevel(grade)
      await prisma.subject.create({
        data: {
          name: subj.name,
          slug,
          lang: cur.lang,
          department: subj.department,
          country: cur.country,
          curriculum: cur.code,
          concept: subj.concept,
          color: subj.color,
          levels: [gradeToLevel(grade)],
          grades: [grade],
          thumbnail: USE_CLICKVIEW
            ? clickviewConceptKey(cvLevel, subj.concept, "thumbnail")
            : `${prefix}/thumbnail`,
          banner: USE_CLICKVIEW
            ? clickviewConceptKey(cvLevel, subj.concept, "banner")
            : `${prefix}/banner`,
          cover: `catalog/concepts/${subj.concept}/cover`,
          status: "PUBLISHED",
          sortOrder: sortIdx++,
        },
      })
      created++
    }
  }

  logSuccess(cur.name, created, "subjects")
  if (skipped > 0) logSuccess("Skipped", skipped, "existing")
}
