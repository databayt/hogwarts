/**
 * Backfill gradeId on existing Class records
 *
 * Parses class names to extract grade numbers and matches them
 * against AcademicGrade records. Idempotent - skips records
 * that already have a gradeId set.
 *
 * Usage:
 *   pnpm db:seed:single backfill-class-grades
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Extract a grade number from a class name string.
 * Handles patterns like:
 *   "Math - Grade 7 A" -> 7
 *   "الصف السابع أ" -> 7
 *   "Grade 10 - Biology" -> 10
 *   "Class 3B" -> 3
 *   "7A" -> 7
 *   "الرياضيات - الصف 5" -> 5
 */
function extractGradeNumber(name: string): number | null {
  // English patterns
  const gradePatterns = [
    /grade\s*(\d+)/i,
    /class\s*(\d+)/i,
    /year\s*(\d+)/i,
    /^(\d+)\s*[a-zA-Z]$/,
    /\b(\d+)\s*[a-zA-Z]\b/,
  ]

  for (const pattern of gradePatterns) {
    const match = name.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num >= 1 && num <= 12) return num
    }
  }

  // Arabic ordinal number patterns (الأول = 1, الثاني = 2, etc.)
  const arabicOrdinals: Record<string, number> = {
    الأول: 1,
    الثاني: 2,
    الثالث: 3,
    الرابع: 4,
    الخامس: 5,
    السادس: 6,
    السابع: 7,
    الثامن: 8,
    التاسع: 9,
    العاشر: 10,
    الحادي: 11,
    الثاني_عشر: 12,
  }

  for (const [ordinal, num] of Object.entries(arabicOrdinals)) {
    if (name.includes(ordinal)) return num
  }

  // Arabic digit patterns: "الصف 5" or just a standalone number
  const arabicDigitMatch = name.match(/الصف\s*(\d+)/)
  if (arabicDigitMatch) {
    const num = parseInt(arabicDigitMatch[1], 10)
    if (num >= 1 && num <= 12) return num
  }

  return null
}

export async function backfillClassGrades() {
  console.log("[backfill-class-grades] Starting...")

  // Get all schools
  const schools = await prisma.school.findMany({
    select: { id: true, name: true },
  })

  let totalUpdated = 0
  let totalSkipped = 0
  let totalNoMatch = 0

  for (const school of schools) {
    // Get grades for this school
    const grades = await prisma.academicGrade.findMany({
      where: { schoolId: school.id },
      select: { id: true, gradeNumber: true, name: true },
    })

    if (grades.length === 0) {
      console.log(`  [${school.name}] No AcademicGrades found, skipping`)
      continue
    }

    const gradeByNumber = new Map(grades.map((g) => [g.gradeNumber, g.id]))

    // Get classes without gradeId
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id, gradeId: null },
      select: { id: true, name: true },
    })

    if (classes.length === 0) {
      console.log(`  [${school.name}] All classes already have gradeId`)
      totalSkipped += classes.length
      continue
    }

    console.log(
      `  [${school.name}] Processing ${classes.length} classes without gradeId...`
    )

    for (const cls of classes) {
      const gradeNumber = extractGradeNumber(cls.name)
      if (gradeNumber && gradeByNumber.has(gradeNumber)) {
        await prisma.class.update({
          where: { id: cls.id },
          data: { gradeId: gradeByNumber.get(gradeNumber)! },
        })
        totalUpdated++
      } else {
        totalNoMatch++
        if (gradeNumber) {
          console.log(
            `    "${cls.name}" -> grade ${gradeNumber} (no matching AcademicGrade)`
          )
        }
      }
    }
  }

  console.log(
    `[backfill-class-grades] Done: ${totalUpdated} updated, ${totalSkipped} skipped, ${totalNoMatch} no match`
  )
}

// Allow direct execution
if (require.main === module) {
  backfillClassGrades()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
