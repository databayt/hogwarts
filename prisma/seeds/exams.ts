/**
 * Exams Seed
 * Creates Exams and Results with realistic participation
 *
 * Phase 10: Exams, QBank & Grades
 *
 * Features:
 * - Midterm + Final + 2-3 Quizzes per class
 * - 5% absence rate per exam
 * - Score distribution varies by subject type
 * - Process 100 classes (up from 50)
 * - seedGradingConfig: percentage-based, 60% passing, 4.0 GPA scale
 */

import type { PrismaClient } from "@prisma/client"

import type { ClassRef, StudentRef, SubjectRef, TermRef } from "./types"
import {
  getRandomScore,
  logPhase,
  logSuccess,
  processBatch,
  randomNumber,
} from "./utils"

// ============================================================================
// EXAMS SEEDING
// ============================================================================

export async function seedExams(
  prisma: PrismaClient,
  schoolId: string,
  subjects: SubjectRef[],
  classes: ClassRef[],
  term: TermRef
): Promise<string[]> {
  logPhase(8, "EXAMS, QBANK & GRADES", "الامتحانات والدرجات")

  const examIds: string[] = []
  const classesToProcess = classes.slice(0, 100)

  await processBatch(classesToProcess, 10, async (classInfo) => {
    const subject = subjects.find((s) => s.id === classInfo.subjectId)
    if (!subject) return

    type ExamConfig = {
      type: "MIDTERM" | "FINAL" | "QUIZ"
      name: string
      totalMarks: number
      duration: number
      dayOffset: number // Days from term start
    }

    const examTypes: ExamConfig[] = [
      {
        type: "MIDTERM",
        name: "امتحان نصف الفصل",
        totalMarks: 100,
        duration: 90,
        dayOffset: 45,
      },
      {
        type: "FINAL",
        name: "الامتحان النهائي",
        totalMarks: 100,
        duration: 120,
        dayOffset: 100,
      },
      {
        type: "QUIZ",
        name: "اختبار قصير 1",
        totalMarks: 20,
        duration: 30,
        dayOffset: 20,
      },
      {
        type: "QUIZ",
        name: "اختبار قصير 2",
        totalMarks: 20,
        duration: 30,
        dayOffset: 60,
      },
    ]

    for (const examConfig of examTypes) {
      const examTitle = `${examConfig.name} - ${classInfo.name}`
      const examDate = new Date(
        term.startDate.getTime() + examConfig.dayOffset * 24 * 60 * 60 * 1000
      )

      try {
        const existing = await prisma.exam.findFirst({
          where: { schoolId, classId: classInfo.id, title: examTitle },
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
              endTime:
                examConfig.duration === 120
                  ? "11:00"
                  : examConfig.duration === 90
                    ? "10:30"
                    : "09:30",
              duration: examConfig.duration,
              totalMarks: examConfig.totalMarks,
              passingMarks: Math.round(examConfig.totalMarks * 0.6),
              examType: examConfig.type,
              status: "PLANNED",
            },
          })
          examIds.push(exam.id)
        }
      } catch {
        // Skip duplicates
      }
    }
  })

  logSuccess("Exams", examIds.length, "Midterm + Final + Quizzes per class")

  return examIds
}

// ============================================================================
// EXAM RESULTS SEEDING
// ============================================================================

export async function seedExamResults(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  classes: ClassRef[]
): Promise<number> {
  let resultCount = 0

  const exams = await prisma.exam.findMany({
    where: { schoolId },
    select: { id: true, classId: true, totalMarks: true },
  })

  if (exams.length === 0) {
    logSuccess("Exam Results", 0, "no exams found")
    return 0
  }

  const studentsByLevel = new Map<string, StudentRef[]>()
  for (const student of students) {
    if (!student.yearLevelId) continue
    const existing = studentsByLevel.get(student.yearLevelId) || []
    existing.push(student)
    studentsByLevel.set(student.yearLevelId, existing)
  }

  await processBatch(exams, 5, async (exam) => {
    const classInfo = classes.find((c) => c.id === exam.classId)
    if (!classInfo) return

    const levelStudents = studentsByLevel.get(classInfo.yearLevelId) || []

    for (const student of levelStudents) {
      // 5% absence rate
      const isAbsent = randomNumber(1, 100) <= 5

      const marksObtained = isAbsent ? 0 : getRandomScore(exam.totalMarks)
      const percentage = isAbsent ? 0 : (marksObtained / exam.totalMarks) * 100

      let grade = "F"
      if (!isAbsent) {
        if (percentage >= 95) grade = "A+"
        else if (percentage >= 90) grade = "A"
        else if (percentage >= 85) grade = "B+"
        else if (percentage >= 80) grade = "B"
        else if (percentage >= 75) grade = "C+"
        else if (percentage >= 70) grade = "C"
        else if (percentage >= 65) grade = "D+"
        else if (percentage >= 60) grade = "D"
      }

      try {
        await prisma.examResult.upsert({
          where: {
            examId_studentId: { examId: exam.id, studentId: student.id },
          },
          update: { marksObtained, percentage, grade, isAbsent },
          create: {
            schoolId,
            examId: exam.id,
            studentId: student.id,
            marksObtained,
            totalMarks: exam.totalMarks,
            percentage,
            grade,
            isAbsent,
          },
        })
        resultCount++
      } catch {
        // Skip duplicates
      }
    }
  })

  logSuccess("Exam Results", resultCount, "5% absence, grade distribution")

  return resultCount
}

// ============================================================================
// GRADING CONFIG SEEDING
// ============================================================================

export async function seedGradingConfig(
  prisma: PrismaClient,
  schoolId: string
): Promise<void> {
  try {
    await prisma.schoolGradingConfig.upsert({
      where: { schoolId },
      update: {},
      create: {
        schoolId,
        primarySystem: "PERCENTAGE",
        gpaScale: 4.0,
        showPercentage: true,
        showGPA: true,
        showLetter: true,
        passingThreshold: 60,
        cgpaWeighting: {
          midterm: 0.3,
          final: 0.5,
          quiz: 0.1,
          assignment: 0.1,
        },
        retakePolicy: "best",
        maxRetakes: 2,
        retakePenaltyPercent: 0,
        roundingMethod: "round",
      },
    })
    logSuccess("Grading Config", 1, "percentage-based, 60% passing, 4.0 GPA")
  } catch {
    // Skip if already exists
  }
}
