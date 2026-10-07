// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-off: rewrite stored grade names to the school's country preset
 * (`@/lib/grade/presets.ts`). Most screens print `AcademicGrade.name`,
 * `YearLevel.levelName` and `Section.name` straight from the database, so a
 * Sudanese school keeps reading "الصف السابع" / "Grade 7" / "الصف السابع - أ"
 * until those rows say "الأول متوسط" / "الأول متوسط - أ".
 *
 * Only rows whose current name still reads as the SAME grade are touched
 * (`parseGrade(name) === gradeNumber`) — a name the school typed itself
 * ("فصل النجوم") is left alone and listed as skipped. Sections are renamed
 * only when they carry the composed Arabic default `<grade name> - <letter>`.
 * Schools without a preset (and international schools) are skipped.
 *
 * DRY RUN by default — prints every change. `--apply` writes, one
 * transaction per school. Targets DATABASE_URL in the central .env; for prod,
 * export the prod URL on the command line, behind a Neon restore point.
 *
 * Usage:
 *   pnpm tsx prisma/scripts/rename-grades-to-preset.ts                 # all schools, dry run
 *   pnpm tsx prisma/scripts/rename-grades-to-preset.ts --domain demo   # one school
 *   pnpm tsx prisma/scripts/rename-grades-to-preset.ts --apply
 */

// dotenv first — the Prisma client reads DATABASE_URL at construction.
import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { getGradePreset, gradeLabel, parseGrade } from "@/lib/grade"

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const flag = (name: string) => process.argv.includes(`--${name}`)

interface Rename {
  id: string
  from: string
  to: string
}

async function main() {
  const apply = flag("apply")
  const domain = arg("domain")
  const prisma = new PrismaClient()

  try {
    const schools = await prisma.school.findMany({
      where: domain ? { domain } : {},
      select: { id: true, domain: true, country: true, schoolType: true },
      orderBy: { domain: "asc" },
    })
    if (domain && schools.length === 0)
      throw new Error(`No school with domain "${domain}"`)

    let total = 0
    for (const school of schools) {
      const country = school.country?.trim().toUpperCase() ?? ""
      if (
        !country ||
        school.schoolType === "international" ||
        getGradePreset(country).id !== country
      ) {
        console.log(
          `- ${school.domain}: no preset (${country || "no country"}), skipped`
        )
        continue
      }
      const naming = { lang: "ar", country } as const

      const [grades, yearLevels, sections] = await Promise.all([
        prisma.academicGrade.findMany({
          where: { schoolId: school.id },
          select: { id: true, name: true, gradeNumber: true },
        }),
        prisma.yearLevel.findMany({
          where: { schoolId: school.id },
          select: { id: true, levelName: true },
        }),
        prisma.section.findMany({
          where: { schoolId: school.id },
          select: { id: true, name: true, letter: true, gradeId: true },
        }),
      ])

      const skipped: string[] = []
      const gradeRenames: Rename[] = []
      const newGradeName = new Map<string, { from: string; to: string }>()
      for (const g of grades) {
        const to = gradeLabel(g.gradeNumber, naming)
        newGradeName.set(g.id, { from: g.name, to })
        if (g.name === to) continue
        if (parseGrade(g.name) !== g.gradeNumber) {
          skipped.push(`grade "${g.name}" (#${g.gradeNumber})`)
          continue
        }
        gradeRenames.push({ id: g.id, from: g.name, to })
      }

      const levelRenames: Rename[] = []
      for (const y of yearLevels) {
        const n = parseGrade(y.levelName)
        if (n === null) {
          skipped.push(`year level "${y.levelName}"`)
          continue
        }
        const to = gradeLabel(n, naming)
        if (y.levelName !== to)
          levelRenames.push({ id: y.id, from: y.levelName, to })
      }

      const sectionRenames: Rename[] = []
      for (const s of sections) {
        const grade = newGradeName.get(s.gradeId)
        if (!grade || grade.from === grade.to) continue
        if (s.name !== `${grade.from} - ${s.letter}`) continue
        sectionRenames.push({
          id: s.id,
          from: s.name,
          to: `${grade.to} - ${s.letter}`,
        })
      }

      const count =
        gradeRenames.length + levelRenames.length + sectionRenames.length
      total += count
      console.log(
        `\n= ${school.domain} (${country}): ${gradeRenames.length} grades, ${levelRenames.length} year levels, ${sectionRenames.length} sections`
      )
      for (const [kind, list] of [
        ["grade", gradeRenames],
        ["level", levelRenames],
        ["section", sectionRenames],
      ] as const) {
        for (const r of list) console.log(`  ${kind}: ${r.from}  →  ${r.to}`)
      }
      for (const s of skipped) console.log(`  skip (custom name): ${s}`)

      if (!apply || count === 0) continue
      await prisma.$transaction([
        ...gradeRenames.map((r) =>
          prisma.academicGrade.update({
            where: { id: r.id, schoolId: school.id },
            data: { name: r.to, lang: "ar" },
          })
        ),
        ...levelRenames.map((r) =>
          prisma.yearLevel.update({
            where: { id: r.id, schoolId: school.id },
            data: { levelName: r.to, lang: "ar" },
          })
        ),
        ...sectionRenames.map((r) =>
          prisma.section.update({
            where: { id: r.id, schoolId: school.id },
            data: { name: r.to, lang: "ar" },
          })
        ),
      ])
      console.log(`  applied`)
    }

    console.log(
      `\n${apply ? "Applied" : "Dry run —"} ${total} renames${apply ? "" : " (pass --apply to write)"}`
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
