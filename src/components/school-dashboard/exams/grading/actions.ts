/**
 * Grading System Server Actions
 *
 * Server actions for:
 * - Grading configuration management
 * - Grade conversions
 * - CGPA calculations
 */

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { GradingSystem } from "@prisma/client"

import { db } from "@/lib/db"

import {
  calculateCumulativeGPA,
  calculateSemesterGPA,
  getGPAClassification,
  requiredGPAForTarget,
} from "./cgpa-calculator"
import { convertGrade, getAllGradeFormats, isPassing } from "./grade-converter"
import {
  cgpaCalculationSchema,
  gradeConversionSchema,
  gradingConfigSchema,
  targetGPASchema,
  type CGPACalculationInput,
  type GradeConversionInput,
  type GradingConfigInput,
  type TargetGPAInput,
} from "./validation"

/**
 * Get school grading configuration
 */
export async function getGradingConfig() {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  const config = await db.schoolGradingConfig.findUnique({
    where: { schoolId },
  })

  return config
}

/**
 * Create or update school grading configuration
 */
export async function saveGradingConfig(data: GradingConfigInput) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Validate input
  const validated = gradingConfigSchema.parse(data)

  // Upsert configuration
  const config = await db.schoolGradingConfig.upsert({
    where: { schoolId },
    create: {
      schoolId,
      primarySystem: validated.primarySystem,
      gpaScale: validated.gpaScale,
      showPercentage: validated.showPercentage,
      showGPA: validated.showGPA,
      showLetter: validated.showLetter,
      passingThreshold: validated.passingThreshold,
      cgpaWeighting: validated.cgpaWeighting ?? undefined,
      customBoundaries: validated.customBoundaries ?? undefined,
      retakePolicy: validated.retakePolicy,
      maxRetakes: validated.maxRetakes,
      retakePenaltyPercent: validated.retakePenaltyPercent,
    },
    update: {
      primarySystem: validated.primarySystem,
      gpaScale: validated.gpaScale,
      showPercentage: validated.showPercentage,
      showGPA: validated.showGPA,
      showLetter: validated.showLetter,
      passingThreshold: validated.passingThreshold,
      cgpaWeighting: validated.cgpaWeighting ?? undefined,
      customBoundaries: validated.customBoundaries ?? undefined,
      retakePolicy: validated.retakePolicy,
      maxRetakes: validated.maxRetakes,
      retakePenaltyPercent: validated.retakePenaltyPercent,
    },
  })

  revalidatePath("/settings/grading")

  return { success: true, config }
}

/**
 * Convert a grade between systems
 */
export async function convertGradeAction(data: GradeConversionInput) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Validate input
  const validated = gradeConversionSchema.parse(data)

  // Get school's custom boundaries if any
  const config = await db.schoolGradingConfig.findUnique({
    where: { schoolId },
  })

  const boundaries = config?.customBoundaries as
    | Array<{
        grade: string
        minScore: number
        maxScore: number
        gpa4: number
        gpa5: number
      }>
    | undefined

  // Convert grade
  const result = convertGrade(
    validated.value,
    validated.fromSystem as GradingSystem,
    validated.toSystem as GradingSystem,
    { boundaries }
  )

  return { success: true, result }
}

/**
 * Get all grade formats for a score
 */
export async function getAllFormatsAction(percentage: number) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Get school's custom boundaries if any
  const config = await db.schoolGradingConfig.findUnique({
    where: { schoolId },
  })

  const boundaries = config?.customBoundaries as
    | Array<{
        grade: string
        minScore: number
        maxScore: number
        gpa4: number
        gpa5: number
      }>
    | undefined

  const formats = getAllGradeFormats(percentage, { boundaries })

  // Add passing status based on school threshold
  const passingThreshold = config?.passingThreshold ?? 60

  return {
    success: true,
    formats: {
      ...formats,
      passed: percentage >= passingThreshold,
    },
  }
}

/**
 * Check if a grade is passing
 */
export async function checkPassingAction(
  value: number | string,
  system: GradingSystem
) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Get school's passing threshold
  const config = await db.schoolGradingConfig.findUnique({
    where: { schoolId },
  })

  const threshold = config?.passingThreshold ?? undefined
  const passing = isPassing(value, system, threshold)

  return { success: true, passing }
}

/**
 * Calculate CGPA for a student
 */
export async function calculateCGPAAction(data: CGPACalculationInput) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Validate input
  const validated = cgpaCalculationSchema.parse(data)

  // Calculate CGPA
  const result = calculateCumulativeGPA(validated.semesters, {
    gpaScale: validated.gpaScale,
    retakePolicy: validated.retakePolicy,
    includeCurrentSemester: validated.includeCurrentSemester,
  })

  // Get classification
  const classification = getGPAClassification(result.cgpa, validated.gpaScale)

  return {
    success: true,
    result: {
      ...result,
      ...classification,
    },
  }
}

/**
 * Calculate semester GPA
 */
export async function calculateSemesterGPAAction(
  courses: Array<{
    courseId: string
    courseName: string
    creditHours: number
    percentage: number
    gradePoint?: number
  }>,
  gpaScale: 4 | 5 = 4
) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  const result = calculateSemesterGPA(courses, gpaScale)
  const classification = getGPAClassification(result.cgpa, gpaScale)

  return {
    success: true,
    result: {
      ...result,
      ...classification,
    },
  }
}

/**
 * Calculate required GPA to reach target CGPA
 */
export async function calculateRequiredGPAAction(data: TargetGPAInput) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Validate input
  const validated = targetGPASchema.parse(data)

  const requiredGPA = requiredGPAForTarget(
    validated.currentCGPA,
    validated.currentCredits,
    validated.targetCGPA,
    validated.remainingCredits
  )

  return {
    success: true,
    requiredGPA,
    achievable: requiredGPA !== null && requiredGPA <= 4.0,
    message:
      requiredGPA === null
        ? "Target CGPA is not achievable with remaining credits"
        : requiredGPA <= 0
          ? "Target CGPA already achieved"
          : `You need a GPA of ${requiredGPA} in remaining ${validated.remainingCredits} credits`,
  }
}

/**
 * Get student's CGPA history
 */
export async function getStudentCGPAHistory(studentId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Get all exam results for the student with course/exam info
  const results = await db.examResult.findMany({
    where: {
      schoolId,
      studentId,
      exam: {
        status: "COMPLETED",
      },
    },
    include: {
      exam: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  // Group by semester/term (using exam date as proxy)
  const semesters = new Map<
    string,
    {
      semesterId: string
      semesterName: string
      courses: Array<{
        courseId: string
        courseName: string
        creditHours: number
        percentage: number
        attemptNumber: number
        isRetake: boolean
      }>
    }
  >()

  for (const result of results) {
    const semesterKey = result.exam.createdAt.toISOString().slice(0, 7) // YYYY-MM
    const semesterName = new Date(result.exam.createdAt).toLocaleDateString(
      "en-US",
      { month: "long", year: "numeric" }
    )

    if (!semesters.has(semesterKey)) {
      semesters.set(semesterKey, {
        semesterId: semesterKey,
        semesterName,
        courses: [],
      })
    }

    const semester = semesters.get(semesterKey)!
    const courseId = result.exam.subjectId || result.exam.id

    // Check for retakes
    const existingCourse = semester.courses.find((c) => c.courseId === courseId)
    const attemptNumber = existingCourse
      ? semester.courses.filter((c) => c.courseId === courseId).length + 1
      : 1

    semester.courses.push({
      courseId,
      courseName: result.exam.subject?.subjectName || result.exam.title,
      creditHours: 3, // Default credit hours - should be configurable
      percentage:
        typeof result.percentage === "number"
          ? result.percentage
          : ((result.percentage as { toNumber: () => number })?.toNumber?.() ??
            0),
      attemptNumber,
      isRetake: attemptNumber > 1,
    })
  }

  // Get school's grading config
  const config = await db.schoolGradingConfig.findUnique({
    where: { schoolId },
  })

  const gpaScale = (config?.gpaScale ?? 4) as 4 | 5
  const retakePolicy = (config?.retakePolicy ?? "best") as
    | "best"
    | "latest"
    | "average"

  // Calculate cumulative GPA
  const semesterData = Array.from(semesters.values())
  const cgpaResult = calculateCumulativeGPA(semesterData, {
    gpaScale,
    retakePolicy,
    includeCurrentSemester: true,
  })

  const classification = getGPAClassification(cgpaResult.cgpa, gpaScale)

  return {
    success: true,
    semesters: semesterData,
    cgpa: cgpaResult,
    classification,
    gpaScale,
    retakePolicy,
  }
}

/**
 * Bulk update grade boundaries for school
 */
export async function updateGradeBoundaries(
  boundaries: Array<{
    grade: string
    minScore: number
    maxScore: number
    gpa4: number
    gpa5: number
  }>
) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Validate boundaries
  if (!boundaries || boundaries.length === 0) {
    throw new Error("At least one grade boundary is required")
  }

  // Ensure boundaries cover full range (0-100)
  const sortedBoundaries = [...boundaries].sort(
    (a, b) => b.minScore - a.minScore
  )

  // Update configuration
  const config = await db.schoolGradingConfig.upsert({
    where: { schoolId },
    create: {
      schoolId,
      customBoundaries: sortedBoundaries,
    },
    update: {
      customBoundaries: sortedBoundaries,
    },
  })

  revalidatePath("/settings/grading")

  return { success: true, config }
}
