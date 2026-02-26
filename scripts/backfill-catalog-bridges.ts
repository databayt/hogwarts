/**
 * Backfill Subject.catalogSubjectId
 *
 * For each school Subject without a catalogSubjectId, find the matching
 * CatalogSubject by name and set the FK.
 *
 * Usage: npx tsx scripts/backfill-catalog-bridges.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Arabic subject names → English catalog subject names
const ARABIC_TO_ENGLISH: Record<string, string> = {
  الرياضيات: "Math",
  الفيزياء: "Physics",
  الكيمياء: "Chemistry",
  الأحياء: "Life Science",
  العلوم: "Physical Science",
  "اللغة العربية": "English Language Arts",
  "اللغة الإنجليزية": "English Language Arts",
  "اللغة الفرنسية": "World Languages",
  التاريخ: "History",
  الجغرافيا: "Geography",
  "التربية الإسلامية": "Religion and Ethics",
  "القرآن الكريم": "Religion",
  "علوم الحاسوب": "Computer Science and Technology",
  "التربية البدنية": "Physical Education",
  "التربية الفنية": "Arts",
  الاقتصاد: "Economics",
  "علم النفس": "Psychology",
  "علم الاجتماع": "Sociology",
  "المهارات الحياتية": "Life Skills",
  الصحة: "Health",
  "الدراسات الاجتماعية": "Civics and Government",
  "التربية الوطنية": "Civics and Government",
  الحاسوب: "Computer Science and Technology",
  الموسيقى: "Arts",
  "علوم الأرض والفضاء": "Earth and Space Science",
  "العلوم والهندسة": "Science and Engineering Practices",
  "الاقتصاد والأعمال": "Business and Economics",
  "تاريخ السودان": "History",
  "تاريخ العالم": "World History",
  "التعليم المهني": "Career and Technical Education",
  "الاحتفالات والمناسبات": "Celebrations, Commemorations, and Festivals",
  "التطوير المهني": "Teacher Professional Development",
  "اللغات العالمية": "World Languages",
  "التاريخ الأمريكي": "U.S. History",
}

async function main() {
  console.log("Backfilling Subject.catalogSubjectId...")

  // Get all catalog subjects
  const catalogSubjects = await prisma.catalogSubject.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true },
  })

  const catalogMap = new Map(catalogSubjects.map((cs) => [cs.name, cs.id]))
  console.log(`Found ${catalogSubjects.length} catalog subjects`)

  // Get all subjects without catalogSubjectId
  const subjects = await prisma.subject.findMany({
    where: { catalogSubjectId: null },
    select: { id: true, subjectName: true, schoolId: true },
  })

  console.log(`Found ${subjects.length} subjects without catalogSubjectId`)

  let updated = 0
  for (const subject of subjects) {
    // Try direct match first, then Arabic→English mapping
    const englishName = ARABIC_TO_ENGLISH[subject.subjectName]
    const catalogId =
      catalogMap.get(subject.subjectName) ??
      (englishName ? catalogMap.get(englishName) : undefined)

    if (catalogId) {
      await prisma.subject.update({
        where: { id: subject.id },
        data: { catalogSubjectId: catalogId },
      })
      updated++
    } else {
      console.log(`  No match for: "${subject.subjectName}"`)
    }
  }

  console.log(`Updated ${updated} subjects with catalogSubjectId`)
  console.log(
    `Skipped ${subjects.length - updated} (no matching catalog subject)`
  )
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
