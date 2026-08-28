// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pre-warm the per-school translation cache with the OFFICIAL English titles of
 * the Sudan curriculum (subject / chapter / lesson names) so the English UI shows
 * the textbooks' real English rendering instead of a machine translation.
 *
 * Source of truth: `curriculum/sd/g{N}/<subject>/structure.json` — every chapter
 * and lesson carries `title` (as printed in the book, Arabic) and `titleEn`
 * (human translation written during the 2026-08 official-TOC rebuild).
 *
 * The cache (`Translation` @@map translation_cache) is keyed by
 * (schoolId, sourceText, sourceLanguage, targetLanguage) and `localize()` uses
 * script-truth (Arabic text shown in English → sourceLanguage "ar",
 * targetLanguage "en"), so we write exactly those rows for every school whose
 * country is SD (or whose timetable-structure slug starts with "sd").
 *
 * Idempotent: rows we own (provider = "curriculum") are replaced; rows produced
 * by Google for the same source text are superseded (deleted then re-created)
 * because the official title beats a machine guess.
 *
 * Usage: pnpm tsx scripts/sudan-data/prewarm-sd-translations.ts [--dry]
 */

import fs from "fs"
import path from "path"
import { PrismaClient } from "@prisma/client"
import { config } from "dotenv"

config()

const prisma = new PrismaClient()
const ROOT = path.resolve(__dirname, "../../curriculum/sd")
const DRY = process.argv.includes("--dry")

interface StructureLesson {
  title: string
  titleEn?: string
}
interface StructureChapter {
  title: string
  titleEn?: string
  lessons?: StructureLesson[]
}
interface StructureFile {
  lang?: string
  subjectAr?: string
  subjectEn?: string
  chapters?: StructureChapter[]
}

const ARABIC = /[؀-ۿ]/

function collectPairs(): Map<string, string> {
  const pairs = new Map<string, string>()
  const add = (ar?: string, en?: string) => {
    if (!ar || !en) return
    const a = ar.trim()
    const e = en.trim()
    if (!a || !e || !ARABIC.test(a) || ARABIC.test(e)) return
    if (!pairs.has(a)) pairs.set(a, e)
  }
  for (const grade of fs.readdirSync(ROOT)) {
    if (!/^g\d+$/.test(grade)) continue
    const gradeDir = path.join(ROOT, grade)
    for (const subject of fs.readdirSync(gradeDir)) {
      const file = path.join(gradeDir, subject, "structure.json")
      if (!fs.existsSync(file)) continue
      let data: StructureFile
      try {
        data = JSON.parse(fs.readFileSync(file, "utf-8")) as StructureFile
      } catch {
        continue
      }
      if (data.lang && data.lang !== "ar") continue
      add(data.subjectAr, data.subjectEn)
      for (const ch of data.chapters ?? []) {
        add(ch.title, ch.titleEn)
        for (const l of ch.lessons ?? []) add(l.title, l.titleEn)
      }
    }
  }
  return pairs
}

async function main() {
  const pairs = collectPairs()
  console.log(
    `Collected ${pairs.size} official ar→en title pairs from curriculum/sd`
  )

  const schools = await prisma.school.findMany({
    where: {
      OR: [{ country: "SD" }, { timetableStructure: { startsWith: "sd" } }],
    },
    select: { id: true, domain: true },
  })
  console.log(
    `Target schools: ${schools.map((s) => s.domain).join(", ") || "(none)"}`
  )
  if (DRY) {
    for (const [ar, en] of [...pairs.entries()].slice(0, 12))
      console.log(`  ${ar} → ${en}`)
    return
  }

  const sources = [...pairs.keys()]
  for (const school of schools) {
    // Supersede any prior translation of these exact source strings.
    const del = await prisma.translation.deleteMany({
      where: {
        schoolId: school.id,
        sourceLanguage: "ar",
        targetLanguage: "en",
        sourceText: { in: sources },
      },
    })
    const created = await prisma.translation.createMany({
      data: sources.map((sourceText) => ({
        schoolId: school.id,
        sourceText,
        sourceLanguage: "ar",
        targetLanguage: "en",
        translatedText: pairs.get(sourceText)!,
        provider: "curriculum",
      })),
      skipDuplicates: true,
    })
    console.log(
      `  ${school.domain}: replaced ${del.count}, wrote ${created.count} official translations`
    )
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
