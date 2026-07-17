// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
  logWarning,
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

  // Derive the active term from TODAY's date instead of hardcoding Term 1.
  // During Term 2 months (Jan–Jun) a hardcoded Term-1-active flag makes
  // `resolveActiveTerm` (Priority 1) return the wrong term, which then scopes
  // period/timetable lookups to the wrong window. Default to Term 1 outside
  // both windows (e.g. the summer break) so exactly one term is always active.
  const now = new Date()
  const inTerm2 = now >= term2.start && now <= term2.end
  const term1Active = !inTerm2
  const term2Active = inTerm2

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
      isActive: term1Active,
    },
    create: {
      schoolId,
      yearId: schoolYearId,
      termNumber: 1,
      startDate: term1.start,
      endDate: term1.end,
      isActive: term1Active,
    },
  })

  terms.push({
    id: t1.id,
    termNumber: t1.termNumber,
    startDate: t1.startDate,
    endDate: t1.endDate,
    isActive: t1.isActive,
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
      isActive: term2Active,
    },
    create: {
      schoolId,
      yearId: schoolYearId,
      termNumber: 2,
      startDate: term2.start,
      endDate: term2.end,
      isActive: term2Active,
    },
  })

  terms.push({
    id: t2.id,
    termNumber: t2.termNumber,
    startDate: t2.startDate,
    endDate: t2.endDate,
    isActive: t2.isActive,
  })

  logSuccess("Terms", terms.length, "Term 1, Term 2")

  return terms
}

// ============================================================================
// PERIODS SEEDING
// ============================================================================

/** Shape shared by SCHOOL_PERIODS and a structure's period list. */
type PeriodDef = {
  name: string
  startTime: string
  endTime: string
  isBreak: boolean
}

/**
 * Period definitions for a school: its declared TIMETABLE_STRUCTURE when we
 * recognise one, else the legacy hand-rolled list.
 */
async function resolvePeriodDefs(
  prisma: PrismaClient,
  schoolId: string
): Promise<PeriodDef[]> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { timetableStructure: true },
  })
  const declared = school?.timetableStructure
  if (!declared) return SCHOOL_PERIODS

  const { getStructureBySlug, LEGACY_TEMPLATE_MAP } =
    await import("@/components/school-dashboard/timetable/structures")
  const structure = getStructureBySlug(
    LEGACY_TEMPLATE_MAP[declared] ?? declared
  )
  if (!structure) {
    logWarning(
      `Unknown timetableStructure "${declared}" — using SCHOOL_PERIODS`
    )
    return SCHOOL_PERIODS
  }
  // `type` is the structure's source of truth for break-ness ("class" | "break"
  // | "lunch"); Period has no isBreak column, so the NAME is what every reader
  // downstream keys off — keep the structure's names verbatim.
  return structure.periods.map((p) => ({
    name: p.name,
    startTime: p.startTime,
    endTime: p.endTime,
    isBreak: p.type !== "class",
  }))
}

/**
 * Drop periods left over from a different structure (or an older seed), but
 * only when nothing references them. Without this a re-seed onto a school that
 * previously held 8 hand-rolled periods leaves BOTH sets — "Period 8" +
 * "Break 1" + "Break 2" alongside the structure's "Break"/"Lunch" — and the
 * grid renders a Frankenstein day.
 */
async function pruneStalePeriods(
  prisma: PrismaClient,
  schoolId: string,
  schoolYearId: string,
  keepNames: string[]
): Promise<void> {
  const stale = await prisma.period.findMany({
    where: { schoolId, yearId: schoolYearId, name: { notIn: keepNames } },
    select: { id: true, name: true, _count: { select: { timetables: true } } },
  })
  if (stale.length === 0) return

  const removable = stale.filter((p) => p._count.timetables === 0)
  const referenced = stale.filter((p) => p._count.timetables > 0)

  if (removable.length > 0) {
    await prisma.period.deleteMany({
      where: { id: { in: removable.map((p) => p.id) } },
    })
    logSuccess(
      "Periods pruned",
      removable.length,
      `stale: ${removable.map((p) => p.name).join(", ")}`
    )
  }
  if (referenced.length > 0) {
    // Deleting these would take live timetable slots with them — surface it and
    // let the timetable re-seed (which clears the term) resolve the ordering.
    logWarning(
      `${referenced.length} stale period(s) still hold timetable slots and were kept: ${referenced
        .map((p) => `${p.name}(${p._count.timetables})`)
        .join(", ")} — re-seed the timetable to clear them`
    )
  }
}

/**
 * Seed school periods from the school's DECLARED timetable structure
 * (TIMETABLE_STRUCTURES) — the same definitions the onboarding path applies,
 * so seed and onboarding share one source of truth. Mirrors the timetable
 * generator swap and the retirement of the hand-rolled catalog/demo.ts.
 *
 * The demo declares `timetableStructure: "sd-private"` (المدارس الخاصة
 * السودانية — 7×50min, 07:15–14:25, Sun–Thu) but this function used to
 * hand-roll SCHOOL_PERIODS (8×45min, 07:45–15:00), so the school claimed a
 * Sudanese structure it did not have. Two visible bugs on /ar/timetable:
 *  - the hand-rolled breaks were named "Break 1"/"Break 2". EVERY break/lunch
 *    check in the block matches the English substring "lunch" (Period has no
 *    isBreak column), so nothing matched → `lunchTime` resolved to "" and the
 *    Lunch row rendered with no time at all.
 *  - `lunchAfterPeriod` is read from the STRUCTURE (5) while the hand-rolled
 *    lunch sat after period 6 → the row was drawn a full period too early.
 *
 * Falls back to SCHOOL_PERIODS only when the school declares no (known)
 * structure, so non-Sudanese/unconfigured schools behave exactly as before.
 */
export async function seedPeriods(
  prisma: PrismaClient,
  schoolId: string,
  schoolYearId: string
): Promise<PeriodRef[]> {
  const periods: PeriodRef[] = []
  const periodDefs = await resolvePeriodDefs(prisma, schoolId)

  for (const periodData of periodDefs) {
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
        isBreak: periodData.isBreak,
      },
      create: {
        schoolId,
        yearId: schoolYearId,
        name: periodData.name,
        startTime,
        endTime,
        isBreak: periodData.isBreak,
      },
    })

    periods.push({
      id: period.id,
      name: period.name,
      startTime: periodData.startTime,
      endTime: periodData.endTime,
    })
  }

  await pruneStalePeriods(
    prisma,
    schoolId,
    schoolYearId,
    periodDefs.map((p) => p.name)
  )

  // Count the definitions we actually seeded — reading SCHOOL_PERIODS here
  // reported the hand-rolled 8/2 split regardless of the structure applied.
  const teachingPeriods = periodDefs.filter((p) => !p.isBreak).length
  const breakPeriods = periodDefs.filter((p) => p.isBreak).length

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
  // Unification-safe + idempotent: if departments already exist — e.g. the
  // production setupDefaultsForSchool created English-named ones during an
  // earlier provisioning, or a prior seed ran — REUSE them. The upsert below
  // keys on departmentName, so seeding the Arabic names on top of existing
  // English departments would DOUBLE the list (6 EN + 6 AR). Reusing keeps a
  // single source of truth and lets the i18n layer translate on display.
  const existingDepartments = await prisma.department.findMany({
    where: { schoolId },
    select: { id: true, departmentName: true, lang: true },
  })
  if (existingDepartments.length > 0) {
    logSuccess(
      "Departments",
      existingDepartments.length,
      "already provisioned — reused (no language duplicates)"
    )
    return existingDepartments.map((d) => ({
      id: d.id,
      departmentName: d.departmentName,
      lang: d.lang ?? "ar",
    }))
  }

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
