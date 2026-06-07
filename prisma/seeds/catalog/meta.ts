// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Curriculum Seed
 *
 * Creates Curriculum records from existing Subject country+curriculum combos,
 * then backfills Subject.curriculumId.
 *
 * Usage: pnpm db:seed:single meta
 */

import type { PrismaClient } from "@prisma/client"

import { logSuccess } from "../utils"

const CURRICULUM_DATA: Array<{
  country: string
  code: string
  slug: string
  name: string
  lang: string
  organization?: string
  gradeRange?: string
  structure?: string
}> = [
  {
    country: "SD",
    code: "national",
    slug: "sd-national",
    name: "المنهج السوداني الوطني",
    lang: "ar",
    organization: "وزارة التربية والتعليم - السودان",
    gradeRange: "1-12",
    structure: "8+3", // basic (8 years) + secondary (3 years)
  },
  {
    country: "US",
    code: "us-k12",
    slug: "us-k12",
    name: "US K-12 Curriculum",
    lang: "en",
    organization: "Various State Departments of Education",
    gradeRange: "K-12",
    structure: "5+3+4", // elementary+middle+high
  },
]

export async function seedCurriculum(prisma: PrismaClient): Promise<void> {
  console.log("  Seeding Curriculum records...")

  let created = 0
  let existing = 0

  for (const data of CURRICULUM_DATA) {
    const result = await prisma.curriculum.upsert({
      where: {
        country_code: { country: data.country, code: data.code },
      },
      create: {
        name: data.name,
        slug: data.slug,
        code: data.code,
        country: data.country,
        lang: data.lang,
        organization: data.organization,
        gradeRange: data.gradeRange,
        structure: data.structure,
        status: "PUBLISHED",
      },
      update: {},
    })

    if (result) {
      const subjectCount = await prisma.subject.count({
        where: { country: data.country, curriculum: data.code },
      })

      if (subjectCount > 0) {
        existing++
      } else {
        created++
      }
    }
  }

  logSuccess("Curriculum", CURRICULUM_DATA.length, "curriculum records")

  // Backfill Subject.curriculumId
  console.log("  Backfilling Subject.curriculumId...")

  let backfilled = 0

  for (const data of CURRICULUM_DATA) {
    const curriculum = await prisma.curriculum.findUnique({
      where: { country_code: { country: data.country, code: data.code } },
      select: { id: true },
    })

    if (!curriculum) continue

    const result = await prisma.subject.updateMany({
      where: {
        country: data.country,
        curriculum: data.code,
        curriculumId: null,
      },
      data: {
        curriculumId: curriculum.id,
      },
    })

    backfilled += result.count
  }

  logSuccess("Backfill", backfilled, "subjects linked to curriculum")
}
