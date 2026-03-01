// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cleanup Sudanese Catalog
 *
 * Removes all CatalogSubject records where country="SD" and curriculum="national"
 * along with their cascaded CatalogChapter, CatalogLesson, and
 * SchoolSubjectSelection records.
 *
 * Usage: pnpm cleanup:sudanese
 */

import { PrismaClient } from "@prisma/client"

async function main() {
  const prisma = new PrismaClient()

  try {
    console.log("🧹 Cleanup Sudanese Catalog Subjects")
    console.log("=====================================\n")

    // Find all Sudanese catalog subjects
    const sdSubjects = await prisma.catalogSubject.findMany({
      where: { country: "SD", curriculum: "national" },
      select: { id: true, name: true, slug: true },
    })

    if (sdSubjects.length === 0) {
      console.log("No Sudanese catalog subjects found. Nothing to clean up.")
      return
    }

    console.log(`Found ${sdSubjects.length} Sudanese subjects to remove:\n`)
    for (const s of sdSubjects) {
      console.log(`  - ${s.name} (${s.slug})`)
    }
    console.log()

    const subjectIds = sdSubjects.map((s) => s.id)

    // 1. Delete SchoolSubjectSelection records pointing to these subjects
    const deletedSelections = await prisma.schoolSubjectSelection.deleteMany({
      where: { catalogSubjectId: { in: subjectIds } },
    })
    console.log(
      `Deleted ${deletedSelections.count} SchoolSubjectSelection records`
    )

    // 2. Delete CatalogLessons (via chapters)
    const chapters = await prisma.catalogChapter.findMany({
      where: { subjectId: { in: subjectIds } },
      select: { id: true },
    })
    const chapterIds = chapters.map((c) => c.id)

    const deletedLessons = await prisma.catalogLesson.deleteMany({
      where: { chapterId: { in: chapterIds } },
    })
    console.log(`Deleted ${deletedLessons.count} CatalogLesson records`)

    // 3. Delete CatalogChapters
    const deletedChapters = await prisma.catalogChapter.deleteMany({
      where: { subjectId: { in: subjectIds } },
    })
    console.log(`Deleted ${deletedChapters.count} CatalogChapter records`)

    // 4. Delete CatalogSubjects
    const deletedSubjects = await prisma.catalogSubject.deleteMany({
      where: { id: { in: subjectIds } },
    })
    console.log(`Deleted ${deletedSubjects.count} CatalogSubject records`)

    console.log(
      "\n✅ Sudanese catalog cleanup complete. Only ClickView subjects remain."
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
