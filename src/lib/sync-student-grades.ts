import { db } from "@/lib/db"

/**
 * Parse grade string like "Grade 7", "7", "الصف السابع" into a grade number.
 * Mirrors parseSectionString from csv-import.ts but only extracts the grade number.
 */
function parseGradeNumber(input: string): number | null {
  // Try "Grade N" pattern
  const gradeMatch = input.match(/grade\s*(-?\d+)/i)
  if (gradeMatch) return parseInt(gradeMatch[1], 10)

  // Try plain number
  const numMatch = input.match(/^(-?\d+)$/)
  if (numMatch) return parseInt(numMatch[1], 10)

  // Try "N-X" pattern (e.g. "7-A")
  const sectionMatch = input.match(/^(-?\d+)\s*[-]/)
  if (sectionMatch) return parseInt(sectionMatch[1], 10)

  return null
}

/**
 * Sync students that have a raw yearLevel string but no academicGradeId.
 * Resolves yearLevel → grade number → AcademicGrade record for the school.
 */
export async function syncStudentGrades(
  schoolId: string
): Promise<{ updated: number }> {
  // Find students with yearLevel but no grade assignment
  const students = await db.student.findMany({
    where: {
      schoolId,
      yearLevel: { not: null },
      academicGradeId: null,
    },
    select: { id: true, yearLevel: true },
  })

  if (students.length === 0) return { updated: 0 }

  // Build grade number → gradeId lookup
  const grades = await db.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, gradeNumber: true, name: true },
  })

  const gradeByNumber = new Map<number, string>()
  for (const g of grades) {
    if (g.gradeNumber != null) gradeByNumber.set(g.gradeNumber, g.id)
    const num = parseInt(g.name, 10)
    if (!isNaN(num)) gradeByNumber.set(num, g.id)
  }

  if (gradeByNumber.size === 0) return { updated: 0 }

  // Resolve each student's yearLevel to a grade
  let updated = 0
  for (const student of students) {
    if (!student.yearLevel) continue
    const gradeNumber = parseGradeNumber(student.yearLevel)
    if (gradeNumber == null) continue

    const gradeId = gradeByNumber.get(gradeNumber)
    if (!gradeId) continue

    await db.student.update({
      where: { id: student.id },
      data: { academicGradeId: gradeId },
    })
    updated++
  }

  return { updated }
}
