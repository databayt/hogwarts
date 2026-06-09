// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Curriculum Registry
 *
 * The single source of truth for the 12 supported curricula. Upserts one
 * `Curriculum` record per entry, then backfills `Subject.curriculumId` for any
 * subjects already seeded under that code. The per-curriculum source files
 * (us/sd/gb/cbse/caie-igcse/ib + the nationals) only ever write the `curriculum`
 * CODE onto subjects — this file owns the registry rows and the FK link.
 *
 * Mirrors the coverage table at /docs/catalog. Run after the sources (or any
 * time — the backfill is idempotent and keyed on curriculumId IS NULL).
 *
 * Usage: pnpm db:seed:single registry
 */

import type { PrismaClient } from "@prisma/client"

import { logSuccess } from "../utils"

export interface CurriculumRecord {
  country: string
  code: string
  slug: string
  name: string
  lang: string
  organization: string
  gradeRange: string
  structure: string
}

/** The canonical 12 curricula. `code` is canonical (bare ISO or BODY-PROGRAMME). */
export const CURRICULA: CurriculumRecord[] = [
  // ── national ──
  {
    country: "SD",
    code: "SD",
    slug: "sd-national",
    name: "المنهج السوداني الوطني",
    lang: "ar",
    organization: "وزارة التربية والتعليم - السودان",
    gradeRange: "1-12",
    structure: "8+3",
  },
  {
    country: "US",
    code: "US",
    slug: "us-k12",
    name: "US K-12 Curriculum",
    lang: "en",
    organization: "Various State Departments of Education",
    gradeRange: "K-12",
    structure: "5+3+4",
  },
  {
    country: "GB",
    code: "GB",
    slug: "gb-national",
    name: "England National Curriculum",
    lang: "en",
    organization: "Department for Education (England)",
    gradeRange: "1-12",
    structure: "KS1-KS4 + Sixth Form",
  },
  {
    country: "SA",
    code: "SA",
    slug: "sa-national",
    name: "المنهج السعودي الوطني",
    lang: "ar",
    organization: "وزارة التعليم - المملكة العربية السعودية",
    gradeRange: "1-12",
    structure: "6+3+3",
  },
  {
    country: "EG",
    code: "EG",
    slug: "eg-national",
    name: "المنهج المصري الوطني",
    lang: "ar",
    organization: "وزارة التربية والتعليم - مصر",
    gradeRange: "1-12",
    structure: "6+3+3",
  },
  {
    country: "AE",
    code: "AE",
    slug: "ae-national",
    name: "منهج الإمارات الوطني",
    lang: "ar",
    organization: "وزارة التربية والتعليم - الإمارات",
    gradeRange: "1-12",
    structure: "5+4+3",
  },
  {
    country: "QA",
    code: "QA",
    slug: "qa-national",
    name: "المنهج القطري الوطني",
    lang: "ar",
    organization: "وزارة التعليم والتعليم العالي - قطر",
    gradeRange: "1-12",
    structure: "6+3+3",
  },
  {
    country: "KW",
    code: "KW",
    slug: "kw-national",
    name: "المنهج الكويتي الوطني",
    lang: "ar",
    organization: "وزارة التربية - الكويت",
    gradeRange: "1-12",
    structure: "5+4+3",
  },
  {
    country: "JO",
    code: "JO",
    slug: "jo-national",
    name: "المنهج الأردني الوطني",
    lang: "ar",
    organization: "وزارة التربية والتعليم - الأردن",
    gradeRange: "1-12",
    structure: "6+4+2",
  },
  // ── international ──
  {
    country: "IN",
    code: "CBSE",
    slug: "cbse",
    name: "Indian CBSE (NCERT)",
    lang: "en",
    organization: "Central Board of Secondary Education / NCERT",
    gradeRange: "1-12",
    structure: "5+3+2+2",
  },
  {
    country: "*",
    code: "CAIE-IGCSE",
    slug: "cambridge-igcse",
    name: "Cambridge IGCSE",
    lang: "en",
    organization: "Cambridge Assessment International Education (CAIE)",
    gradeRange: "10-11",
    structure: "IGCSE",
  },
  {
    country: "*",
    code: "IB-DP",
    slug: "ib-diploma",
    name: "International Baccalaureate (Diploma Programme)",
    lang: "en",
    organization: "International Baccalaureate Organization (IBO)",
    gradeRange: "12-13",
    structure: "Diploma Programme",
  },
]

export async function seedCurriculumRegistry(
  prisma: PrismaClient
): Promise<void> {
  console.log("  Seeding Curriculum registry (12 records)...")

  let linked = 0

  for (const c of CURRICULA) {
    const { id } = await prisma.curriculum.upsert({
      where: { country_code: { country: c.country, code: c.code } },
      create: {
        name: c.name,
        slug: c.slug,
        code: c.code,
        country: c.country,
        lang: c.lang,
        organization: c.organization,
        gradeRange: c.gradeRange,
        structure: c.structure,
        status: "PUBLISHED",
      },
      // re-running refreshes metadata (the old `update: {}` was a no-op)
      update: {
        name: c.name,
        slug: c.slug,
        lang: c.lang,
        organization: c.organization,
        gradeRange: c.gradeRange,
        structure: c.structure,
      },
    })

    // Codes are globally unique, so key the link on `curriculum` alone — this
    // also covers the transnational rows where country is "*".
    const { count } = await prisma.subject.updateMany({
      where: { curriculum: c.code, curriculumId: null },
      data: { curriculumId: id },
    })
    linked += count
  }

  logSuccess("Curriculum", CURRICULA.length, "registry records")
  logSuccess("Backfill", linked, "subjects linked")
}
