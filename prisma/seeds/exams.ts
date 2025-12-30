/**
 * Exams Seed
 * Creates Exams and Results
 *
 * Phase 8: Exams, QBank & Grades
 */

import type { PrismaClient } from "@prisma/client"

import type { ClassRef, StudentRef, SubjectRef, TermRef } from "./types"
import { getRandomScore, logPhase, logSuccess, processBatch } from "./utils"

// ============================================================================
// EXAMS SEEDING
// ============================================================================

/**
 * Seed exams for each class (Midterm + Final)
 */
export async function seedExams(
  prisma: PrismaClient,
  schoolId: string,
  subjects: SubjectRef[],
  classes: ClassRef[],
  term: TermRef
): Promise<string[]> {
  logPhase(8, "EXAMS, QBANK & GRADES", "الامتحانات والدرجات")

  const examIds: string[] = []

  // Create exams for each class (limit to first 50 classes to keep it reasonable)
  const classesToProcess = classes.slice(0, 50)

  await processBatch(classesToProcess, 10, async (classInfo) => {
    const subject = subjects.find((s) => s.id === classInfo.subjectId)
    if (!subject) return

    // Create Midterm and Final exams with proper typing
    type MidtermConfig = {
      type: "MIDTERM"
      nameEn: string
      daysFromStart: number
    }
    type FinalConfig = { type: "FINAL"; nameEn: string; daysBeforeEnd: number }
    type ExamConfig = MidtermConfig | FinalConfig

    const examTypes: ExamConfig[] = [
      { type: "MIDTERM", nameEn: "Midterm Exam", daysFromStart: 45 },
      { type: "FINAL", nameEn: "Final Exam", daysBeforeEnd: 7 },
    ]

    for (const examConfig of examTypes) {
      const examTitle = `${examConfig.nameEn} - ${classInfo.name}`

      // Calculate exam date based on config type
      let examDate: Date
      if (examConfig.type === "MIDTERM") {
        examDate = new Date(
          term.startDate.getTime() +
            examConfig.daysFromStart * 24 * 60 * 60 * 1000
        )
      } else {
        examDate = new Date(
          term.endDate.getTime() -
            examConfig.daysBeforeEnd * 24 * 60 * 60 * 1000
        )
      }

      try {
        // Check if exam already exists
        const existing = await prisma.exam.findFirst({
          where: {
            schoolId,
            classId: classInfo.id,
            title: examTitle,
          },
        })

        if (!existing) {
          const exam = await prisma.exam.create({
            data: {
              schoolId,
              classId: classInfo.id,
              subjectId: subject.id,
              title: examTitle,
              examDate,
              startTime: "09:00",
              endTime: "11:00",
              duration: 90, // 90 minutes
              totalMarks: 100,
              passingMarks: 60,
              examType: examConfig.type,
              status: "PLANNED",
            },
          })
          examIds.push(exam.id)
        }
      } catch {
        // Skip if exam already exists
      }
    }
  })

  logSuccess("Exams", examIds.length, "Midterm + Final per class")

  return examIds
}

// ============================================================================
// EXAM RESULTS SEEDING
// ============================================================================

/**
 * Seed exam results for students
 */
export async function seedExamResults(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  classes: ClassRef[]
): Promise<number> {
  let resultCount = 0

  // Get all exams
  const exams = await prisma.exam.findMany({
    where: { schoolId },
    select: { id: true, classId: true, totalMarks: true },
  })

  if (exams.length === 0) {
    logSuccess("Exam Results", 0, "no exams found")
    return 0
  }

  // Group students by year level (which maps to classes)
  const studentsByLevel = new Map<string, StudentRef[]>()
  for (const student of students) {
    if (!student.yearLevelId) continue
    const existing = studentsByLevel.get(student.yearLevelId) || []
    existing.push(student)
    studentsByLevel.set(student.yearLevelId, existing)
  }

  // For each exam, create results for students in that class (limit students per exam)
  await processBatch(exams, 5, async (exam) => {
    const classInfo = classes.find((c) => c.id === exam.classId)
    if (!classInfo) return

    // Get all students for this year level (full coverage)
    const levelStudents = studentsByLevel.get(classInfo.yearLevelId) || []

    for (const student of levelStudents) {
      const marksObtained = getRandomScore(exam.totalMarks)
      const percentage = (marksObtained / exam.totalMarks) * 100

      // Calculate grade
      let grade = "F"
      if (percentage >= 95) grade = "A+"
      else if (percentage >= 90) grade = "A"
      else if (percentage >= 85) grade = "B+"
      else if (percentage >= 80) grade = "B"
      else if (percentage >= 75) grade = "C+"
      else if (percentage >= 70) grade = "C"
      else if (percentage >= 65) grade = "D+"
      else if (percentage >= 60) grade = "D"

      try {
        await prisma.examResult.upsert({
          where: {
            examId_studentId: {
              examId: exam.id,
              studentId: student.id,
            },
          },
          update: {
            marksObtained,
            percentage,
            grade,
          },
          create: {
            schoolId,
            examId: exam.id,
            studentId: student.id,
            marksObtained,
            totalMarks: exam.totalMarks,
            percentage,
            grade,
            isAbsent: false,
          },
        })
        resultCount++
      } catch {
        // Skip if result already exists
      }
    }
  })

  logSuccess("Exam Results", resultCount, "with grade distribution")

  return resultCount
}
