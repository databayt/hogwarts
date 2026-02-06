/**
 * Academic Seed
 * Creates School Year, Terms, Periods, Departments, and Year Levels
 *
 * Phase 2: Academic Structure
 */

import type { PrismaClient } from "@prisma/client"

import { DEPARTMENTS, SCHOOL_PERIODS, YEAR_LEVELS } from "./constants"
import type {
  DepartmentRef,
  PeriodRef,
  SchoolYearRef,
  TermRef,
  YearLevelRef,
} from "./types"
import {
  getSchoolYearDates,
  getTermDates,
  logPhase,
  logSuccess,
  parseTime,
} from "./utils"

// ============================================================================
// SCHOOL YEAR SEEDING
// ============================================================================

/**
 * Seed the current school year
 */
export async function seedSchoolYear(
  prisma: PrismaClient,
  schoolId: string
): Promise<SchoolYearRef> {
  logPhase(2, "ACADEMIC STRUCTURE", "الهيكل الأكاديمي")

  const { start, end, yearName } = getSchoolYearDates()

  const schoolYear = await prisma.schoolYear.upsert({
    where: {
      schoolId_yearName: {
        schoolId,
        yearName,
      },
    },
    update: {
      startDate: start,
      endDate: end,
    },
    create: {
      schoolId,
      yearName,
      startDate: start,
      endDate: end,
    },
  })

  logSuccess("School Year", 1, yearName)

  return {
    id: schoolYear.id,
    yearName: schoolYear.yearName,
    startDate: schoolYear.startDate,
    endDate: schoolYear.endDate,
  }
}

// ============================================================================
// TERMS SEEDING
// ============================================================================

/**
 * Seed terms for the school year (2 terms)
 */
export async function seedTerms(
  prisma: PrismaClient,
  schoolId: string,
  schoolYearId: string
): Promise<TermRef[]> {
  const yearStart = new Date()
  if (yearStart.getMonth() < 8) {
    yearStart.setFullYear(yearStart.getFullYear() - 1)
  }
  yearStart.setMonth(8) // September

  const { term1, term2 } = getTermDates(yearStart)
  const terms: TermRef[] = []

  // Term 1
  const t1 = await prisma.term.upsert({
    where: {
      schoolId_yearId_termNumber: {
        schoolId,
        yearId: schoolYearId,
        termNumber: 1,
      },
    },
    update: {
      startDate: term1.start,
      endDate: term1.end,
      isActive: true,
    },
    create: {
      schoolId,
      yearId: schoolYearId,
      termNumber: 1,
      startDate: term1.start,
      endDate: term1.end,
      isActive: true,
    },
  })

  terms.push({
    id: t1.id,
    termNumber: t1.termNumber,
    startDate: t1.startDate,
    endDate: t1.endDate,
  })

  // Term 2
  const t2 = await prisma.term.upsert({
    where: {
      schoolId_yearId_termNumber: {
        schoolId,
        yearId: schoolYearId,
        termNumber: 2,
      },
    },
    update: {
      startDate: term2.start,
      endDate: term2.end,
      isActive: false,
    },
    create: {
      schoolId,
      yearId: schoolYearId,
      termNumber: 2,
      startDate: term2.start,
      endDate: term2.end,
      isActive: false,
    },
  })

  terms.push({
    id: t2.id,
    termNumber: t2.termNumber,
    startDate: t2.startDate,
    endDate: t2.endDate,
  })

  logSuccess("Terms", terms.length, "Term 1, Term 2")

  return terms
}

// ============================================================================
// PERIODS SEEDING
// ============================================================================

/**
 * Seed school periods (7 teaching + 2 breaks)
 */
export async function seedPeriods(
  prisma: PrismaClient,
  schoolId: string,
  schoolYearId: string
): Promise<PeriodRef[]> {
  const periods: PeriodRef[] = []

  for (const periodData of SCHOOL_PERIODS) {
    const startTime = parseTime(periodData.startTime)
    const endTime = parseTime(periodData.endTime)

    const period = await prisma.period.upsert({
      where: {
        schoolId_yearId_name: {
          schoolId,
          yearId: schoolYearId,
          name: periodData.name,
        },
      },
      update: {
        startTime,
        endTime,
      },
      create: {
        schoolId,
        yearId: schoolYearId,
        name: periodData.name,
        startTime,
        endTime,
      },
    })

    periods.push({
      id: period.id,
      name: period.name,
      startTime: periodData.startTime,
      endTime: periodData.endTime,
    })
  }

  const teachingPeriods = SCHOOL_PERIODS.filter((p) => !p.isBreak).length
  const breakPeriods = SCHOOL_PERIODS.filter((p) => p.isBreak).length

  logSuccess(
    "Periods",
    periods.length,
    `${teachingPeriods} teaching, ${breakPeriods} breaks`
  )

  return periods
}

// ============================================================================
// DEPARTMENTS SEEDING
// ============================================================================

/**
 * Seed departments (6 departments)
 */
export async function seedDepartments(
  prisma: PrismaClient,
  schoolId: string
): Promise<DepartmentRef[]> {
  const departments: DepartmentRef[] = []

  for (const deptData of DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: {
        schoolId_departmentName: {
          schoolId,
          departmentName: deptData.name,
        },
      },
      update: {
        lang: "ar",
      },
      create: {
        schoolId,
        departmentName: deptData.name,
        lang: "ar",
      },
    })

    departments.push({
      id: department.id,
      departmentName: department.departmentName,
      lang: "ar",
    })
  }

  logSuccess(
    "Departments",
    departments.length,
    DEPARTMENTS.map((d) => d.name).join(", ")
  )

  return departments
}

// ============================================================================
// YEAR LEVELS SEEDING
// ============================================================================

/**
 * Seed year levels (KG1-KG2, Grade 1-12)
 */
export async function seedYearLevels(
  prisma: PrismaClient,
  schoolId: string
): Promise<YearLevelRef[]> {
  const yearLevels: YearLevelRef[] = []

  for (const levelData of YEAR_LEVELS) {
    // Check by name first, then by order (handles both unique constraints)
    let yearLevel = await prisma.yearLevel.findFirst({
      where: {
        schoolId,
        OR: [{ levelName: levelData.name }, { levelOrder: levelData.order }],
      },
    })

    if (yearLevel) {
      yearLevel = await prisma.yearLevel.update({
        where: { id: yearLevel.id },
        data: {
          levelName: levelData.name,
          lang: "ar",
          levelOrder: levelData.order,
        },
      })
    } else {
      yearLevel = await prisma.yearLevel.create({
        data: {
          schoolId,
          levelName: levelData.name,
          lang: "ar",
          levelOrder: levelData.order,
        },
      })
    }

    yearLevels.push({
      id: yearLevel.id,
      levelName: yearLevel.levelName,
      lang: "ar",
      levelOrder: yearLevel.levelOrder,
    })
  }

  logSuccess("Year Levels", yearLevels.length, "KG1-2, Grade 1-12")

  return yearLevels
}

// ============================================================================
// COMBINED ACADEMIC SEEDING
// ============================================================================

/**
 * Seed all academic structure
 */
export async function seedAcademicStructure(
  prisma: PrismaClient,
  schoolId: string
): Promise<{
  schoolYear: SchoolYearRef
  terms: TermRef[]
  periods: PeriodRef[]
  departments: DepartmentRef[]
  yearLevels: YearLevelRef[]
}> {
  const schoolYear = await seedSchoolYear(prisma, schoolId)
  const terms = await seedTerms(prisma, schoolId, schoolYear.id)
  const periods = await seedPeriods(prisma, schoolId, schoolYear.id)
  const departments = await seedDepartments(prisma, schoolId)
  const yearLevels = await seedYearLevels(prisma, schoolId)

  return {
    schoolYear,
    terms,
    periods,
    departments,
    yearLevels,
  }
}
