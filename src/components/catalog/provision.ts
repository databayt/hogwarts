// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { generateUniqueJoinCode } from "@/lib/join-code"
import {
  computeTermDates,
  resolveAcademicCalendar,
} from "@/components/school-dashboard/timetable/calendars"

import { defaultRoomName } from "./room-naming"
import {
  ensureSubjectSelections,
  setupCatalogForSchool,
  setupDefaultsForSchool,
} from "./setup"

// School-side provisioning that runs AFTER the catalog academic structure
// exists: school year / periods / terms, classrooms + sections, timetable
// slots, and library books — plus the provisioning doctor that detects and
// repairs partially provisioned schools (onboarding runs fire-and-forget,
// so any stage can be lost to a serverless timeout).

/**
 * Resolve the timetable structure slug to provision a school with. Prefers the
 * school's explicitly chosen `timetableStructure`; otherwise derives a sensible
 * default from its country / type / level so timetable provisioning is
 * zero-click even when the onboarding schedule step was skipped.
 */
export async function resolveEffectiveStructureSlug(school: {
  country: string | null
  schoolType?: string | null
  schoolLevel?: string | null
  timetableStructure?: string | null
}): Promise<string> {
  if (school.timetableStructure) return school.timetableStructure
  const { getRecommendedStructures } =
    await import("@/components/school-dashboard/timetable/structures")
  const { autoSelect, recommended } = getRecommendedStructures(
    school.country,
    school.schoolType ?? null,
    school.schoolLevel ?? null
  )
  return autoSelect?.slug ?? recommended[0]?.slug ?? "intl-default"
}

// ============================================================================
// applyTimetableStructureForNewSchool — School year, periods, terms
// ============================================================================

/**
 * Create default school year + periods, then apply timetable structure for a newly onboarded school.
 * Called during onboarding completion when the school selected a schedule structure.
 *
 * Idempotent: year, periods, terms, and week config are each skipped when they
 * already exist (this runs from both onboarding and manual re-provisioning).
 */
export async function applyTimetableStructureForNewSchool(
  schoolId: string,
  structureSlug: string
) {
  // Fetch school country for calendar resolution
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { country: true },
  })

  // Import and call the timetable structure applier
  // This creates Period records from the structure definition
  const { getStructureBySlug, LEGACY_TEMPLATE_MAP } =
    await import("@/components/school-dashboard/timetable/structures")

  const slug = LEGACY_TEMPLATE_MAP[structureSlug] || structureSlug
  const structure = getStructureBySlug(slug)
  if (!structure)
    return { skipped: true, message: `Unknown structure: ${slug}` }

  // Resolve calendar and compute term dates
  const calendar = resolveAcademicCalendar(school?.country, slug)
  const computed = computeTermDates(calendar, new Date())

  // Reuse the CURRENT academic year if it already exists, else create it.
  // We match by yearName OR by date-range overlap with the computed academic
  // window. The date-range arm is what prevents DUPLICATE years: the seed path
  // (`seedSchoolYear`) names years "2025-2026" (hyphen) while `computeTermDates`
  // names them "2025/2026" (slash) — a pure yearName match never reconciles the
  // two and creates a second SchoolYear (the bug behind the demo's 2 years / 2
  // active terms). Overlap matching is still scoped to the current window, so it
  // never reuses a stale prior year (the original concern).
  const existingYear = await db.schoolYear.findFirst({
    where: {
      schoolId,
      OR: [
        { yearName: computed.yearName },
        {
          startDate: { lte: computed.yearEnd },
          endDate: { gte: computed.yearStart },
        },
      ],
    },
    orderBy: { startDate: "desc" },
    select: { id: true },
  })

  let yearId: string

  if (existingYear) {
    yearId = existingYear.id
  } else {
    const year = await db.schoolYear.create({
      data: {
        schoolId,
        yearName: computed.yearName,
        startDate: computed.yearStart,
        endDate: computed.yearEnd,
      },
    })
    yearId = year.id
  }

  // Wrap creation in transaction for atomicity
  const [existingTerms, existingPeriods] = await Promise.all([
    db.term.count({ where: { schoolId, yearId } }),
    db.period.count({ where: { schoolId, yearId } }),
  ])

  return db.$transaction(
    async (tx) => {
      // Create periods (skip when the year already has them — a re-run from
      // the manual publish path must not double every period)
      let createdCount = 0
      if (existingPeriods === 0) {
        for (const period of structure.periods) {
          const [startHour, startMin] = period.startTime.split(":").map(Number)
          const [endHour, endMin] = period.endTime.split(":").map(Number)

          await tx.period.create({
            data: {
              schoolId,
              yearId,
              name: period.name,
              startTime: new Date(Date.UTC(1970, 0, 1, startHour, startMin)),
              endTime: new Date(Date.UTC(1970, 0, 1, endHour, endMin)),
            },
          })
          createdCount++
        }
      }

      let termId: string | undefined

      if (existingTerms === 0) {
        // Create ALL terms from the calendar definition
        for (const termDef of computed.terms) {
          const created = await tx.term.create({
            data: {
              schoolId,
              yearId,
              termNumber: termDef.termNumber,
              startDate: termDef.startDate,
              endDate: termDef.endDate,
              isActive: termDef.isActive,
            },
          })
          if (termDef.isActive) termId = created.id
        }
      }

      // Resolve termId from existing terms if not freshly created. Fall back
      // to the most recent term when none is flagged active — otherwise a
      // school whose terms are all isActive=false never gets a week config
      // and the doctor's schedule stage can never converge to healthy.
      if (!termId) {
        const activeTerm = await tx.term.findFirst({
          where: { schoolId, yearId, isActive: true },
          select: { id: true },
        })
        termId = activeTerm?.id
        if (!termId) {
          const latestTerm = await tx.term.findFirst({
            where: { schoolId, yearId },
            orderBy: { startDate: "desc" },
            select: { id: true },
          })
          termId = latestTerm?.id
        }
      }

      // Persist working days from structure definition
      if (termId) {
        const existingConfig = await tx.schoolWeekConfig.findFirst({
          where: { schoolId },
        })
        if (!existingConfig) {
          await tx.schoolWeekConfig.create({
            data: {
              schoolId,
              termId,
              workingDays: structure.workingDays,
              defaultLunchAfterPeriod: structure.lunchAfterPeriod,
            },
          })
        }
      }

      return { skipped: false, periods: createdCount, yearId, termId }
    },
    { timeout: 30000 }
  )
}

// ============================================================================
// autoProvisionSections — Classrooms + sections per grade
// ============================================================================

/**
 * Auto-provision classrooms and sections based on the school's capacity settings
 * and academic grades. Called after onboarding to create default classroom/section
 * records for each grade.
 */
export async function autoProvisionSections(schoolId: string) {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { sectionsPerGrade: true, studentsPerSection: true },
  })

  const sectionsPerGrade = school?.sectionsPerGrade || 2
  const studentsPerSection = school?.studentsPerSection || 30

  const grades = await db.academicGrade.findMany({
    where: { schoolId },
    orderBy: { gradeNumber: "asc" },
  })

  const classroomType = await db.classroomType.findFirst({
    where: { schoolId },
  })

  if (!classroomType || grades.length === 0) {
    return { classrooms: 0, sections: 0 }
  }

  const letters = "ABCDEFGHIJ".split("")

  // Process each grade in its own transaction to avoid P2028 timeout
  // on Neon (single transaction with 48+ sequential upserts exceeds 30s)
  let classroomCount = 0
  let sectionCount = 0

  for (const grade of grades) {
    const result = await db.$transaction(
      async (tx) => {
        let gradeClassrooms = 0
        let gradeSections = 0

        for (let i = 0; i < sectionsPerGrade; i++) {
          const letter = letters[i]
          // e.g. Grade 1 → A01 (section A), B01 (section B); Grade 12 → A12, B12.
          // Grade-assigned (not shared) so each grade owns its homeroom classrooms.
          const roomName = defaultRoomName(letter, grade.gradeNumber)
          const sectionName = `Grade ${grade.gradeNumber}-${letter}`

          const classroom = await tx.classroom.upsert({
            where: { schoolId_roomName: { schoolId, roomName } },
            create: {
              schoolId,
              roomName,
              capacity: studentsPerSection,
              typeId: classroomType.id,
              gradeId: grade.id,
            },
            update: {},
          })
          gradeClassrooms++

          await tx.section.upsert({
            where: {
              schoolId_gradeId_letter: { schoolId, gradeId: grade.id, letter },
            },
            create: {
              schoolId,
              gradeId: grade.id,
              name: sectionName,
              letter,
              classroomId: classroom.id,
              maxCapacity: studentsPerSection,
            },
            update: {},
          })
          gradeSections++
        }

        return { classrooms: gradeClassrooms, sections: gradeSections }
      },
      { timeout: 15000 }
    )

    classroomCount += result.classrooms
    sectionCount += result.sections
  }

  return { classrooms: classroomCount, sections: sectionCount }
}

// ============================================================================
// autoGenerateTimetableForSchool — Generate timetable slots during onboarding
// ============================================================================

/**
 * Auto-generate timetable slots for a newly onboarded school.
 * Creates a complete schedule with subjects distributed across periods/rooms,
 * but with teacherId=null (teachers can be assigned later).
 *
 * Requires: sections, subject selections, periods, terms, classrooms.
 * Idempotent via createMany({ skipDuplicates: true }).
 */
export async function autoGenerateTimetableForSchool(
  schoolId: string
): Promise<{ success: boolean; slotsCreated: number; warnings: string[] }> {
  const { generateSectionTimetable } =
    await import("@/components/school-dashboard/timetable/generate/algorithm")

  const tag = `[autoGenerateTimetable:${schoolId.slice(-6)}]`

  // 1. Resolve the active term via the SHARED resolver (term-resolver) so
  //    generation targets the exact term the timetable grid reads. Using a bare
  //    `findFirst({ isActive: true })` here could pick a different active term
  //    than the grid when legacy data has duplicates (the demo's 2 active
  //    terms), generating slots under a year the grid never displays.
  const { resolveActiveTerm } = await import("@/lib/term-resolver")
  const resolved = await resolveActiveTerm(schoolId)
  const activeTerm = resolved.term
    ? { id: resolved.term.id, yearId: resolved.term.yearId }
    : null
  if (!activeTerm) {
    console.warn(`${tag} BAIL: No active term`)
    return { success: false, slotsCreated: 0, warnings: ["No active term"] }
  }
  console.log(`${tag} Term: ${activeTerm.id}, Year: ${activeTerm.yearId}`)

  // 2. Get periods (filter out breaks/lunch)
  const periods = await db.period.findMany({
    where: { schoolId, yearId: activeTerm.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true },
  })
  const teachingPeriodIds = periods
    .filter(
      (p) =>
        !p.name.toLowerCase().includes("break") &&
        !p.name.toLowerCase().includes("lunch")
    )
    .map((p) => p.id)
  console.log(
    `${tag} Periods: ${periods.length} total, ${teachingPeriodIds.length} teaching`
  )
  if (teachingPeriodIds.length === 0) {
    console.warn(`${tag} BAIL: No teaching periods`)
    return { success: false, slotsCreated: 0, warnings: ["No periods found"] }
  }

  // 3. Get working days
  const weekConfig = await db.schoolWeekConfig.findFirst({
    where: { schoolId },
    orderBy: { termId: "desc" },
    select: { workingDays: true },
  })
  const workingDays: number[] =
    Array.isArray(weekConfig?.workingDays) && weekConfig!.workingDays.length > 0
      ? weekConfig!.workingDays
      : [0, 1, 2, 3, 4]
  console.log(`${tag} Working days: [${workingDays.join(",")}]`)

  // 4. Get sections
  const sectionsData = await db.section.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      gradeId: true,
      classroomId: true,
    },
  })
  console.log(`${tag} Sections: ${sectionsData.length}`)
  if (sectionsData.length === 0) {
    console.warn(`${tag} BAIL: No sections`)
    return { success: false, slotsCreated: 0, warnings: ["No sections found"] }
  }

  // 5. Get subject selections per grade
  const subjectSelections = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: {
      catalogSubjectId: true,
      gradeId: true,
      weeklyPeriods: true,
      subject: { select: { id: true, name: true } },
    },
  })
  console.log(`${tag} Subject selections: ${subjectSelections.length}`)
  const gradeSubjectsMap = new Map<
    string,
    Array<{ subjectId: string; subjectName: string; hoursPerWeek: number }>
  >()
  for (const sel of subjectSelections) {
    if (!sel.subject) continue
    const list = gradeSubjectsMap.get(sel.gradeId) || []
    list.push({
      subjectId: sel.catalogSubjectId,
      subjectName: sel.subject.name,
      hoursPerWeek: sel.weeklyPeriods ?? 3,
    })
    gradeSubjectsMap.set(sel.gradeId, list)
  }

  // 5b. Teachers + their subject expertise → assign a qualified teacher to each
  //     slot (was teacher-less). Build subjectId → [teacherId] so the algorithm
  //     can pick an available qualified teacher; teachers with no expertise for
  //     a subject are never offered it.
  const teacherRows = await db.teacher.findMany({
    where: { schoolId, employmentStatus: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      subjectExpertise: { where: { schoolId }, select: { subjectId: true } },
    },
  })
  const subjectTeachers = new Map<string, string[]>()
  for (const t of teacherRows) {
    for (const e of t.subjectExpertise) {
      const list = subjectTeachers.get(e.subjectId) ?? []
      list.push(t.id)
      subjectTeachers.set(e.subjectId, list)
    }
  }
  const teacherAvailability = teacherRows.map((t) => ({
    teacherId: t.id,
    teacherName: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
    maxPeriodsPerDay: 6,
    maxPeriodsPerWeek: 25,
    maxConsecutive: 3,
    subjectExpertise: t.subjectExpertise.map((e) => e.subjectId),
    unavailableBlocks: [] as Array<{ dayOfWeek: number; periodId: string }>,
    preferredPeriods: [] as Array<{ dayOfWeek: number; periodId: string }>,
    avoidedPeriods: [] as Array<{ dayOfWeek: number; periodId: string }>,
  }))
  console.log(
    `${tag} Teachers: ${teacherAvailability.length}, subjects with a qualified teacher: ${subjectTeachers.size}`
  )

  // 6. Build SectionRequirement[]
  const sectionRequirements = sectionsData.map((s) => {
    const gradeSubjects = gradeSubjectsMap.get(s.gradeId) || []
    return {
      sectionId: s.id,
      sectionName: s.name,
      gradeId: s.gradeId,
      classroomId: s.classroomId,
      studentCount: 0,
      subjects: gradeSubjects.map((gs) => ({
        subjectId: gs.subjectId,
        subjectName: gs.subjectName,
        hoursPerWeek: gs.hoursPerWeek,
        requiresLab: gs.subjectName.toLowerCase().includes("lab"),
        preferredTeacherIds: subjectTeachers.get(gs.subjectId) ?? [],
      })),
    }
  })

  const sectionsWithSubjects = sectionRequirements.filter(
    (s) => s.subjects.length > 0
  ).length
  console.log(
    `${tag} Sections with subjects: ${sectionsWithSubjects}/${sectionRequirements.length}`
  )
  if (sectionsWithSubjects === 0) {
    console.warn(`${tag} BAIL: No sections have subjects assigned`)
    return {
      success: false,
      slotsCreated: 0,
      warnings: ["No sections have subjects assigned"],
    }
  }

  // 7. Build RoomAvailability[] from classrooms
  const classrooms = await db.classroom.findMany({
    where: { schoolId },
    select: {
      id: true,
      roomName: true,
      capacity: true,
      classroomType: { select: { name: true } },
    },
  })
  const rooms = classrooms.map((r) => ({
    roomId: r.id,
    roomName: r.roomName,
    capacity: r.capacity || 30,
    roomType: r.classroomType?.name || "regular",
    allowedSubjectTypes: [] as string[],
    reservedBlocks: [] as Array<{ dayOfWeek: number; periodId: string }>,
    hasAccessibility: false,
  }))

  console.log(`${tag} Rooms: ${rooms.length}`)

  // 8. Run the algorithm with empty teachers
  console.log(
    `${tag} Running algorithm: ${sectionRequirements.length} sections, ${rooms.length} rooms, ${workingDays.length} days, ${teachingPeriodIds.length} periods`
  )
  const result = generateSectionTimetable(
    sectionRequirements,
    teacherAvailability,
    rooms,
    {
      schoolId,
      termId: activeTerm.id,
      yearId: activeTerm.yearId,
      config: {
        workingDays,
        periodsPerDay: teachingPeriodIds,
        constraints: {
          enforceTeacherExpertise: true,
          enforceRoomCapacity: true,
          maxTeacherPeriodsPerDay: 6,
          maxTeacherPeriodsPerWeek: 25,
          maxConsecutivePeriods: 3,
          requireLunchBreak: true,
          preventBackToBack: false,
        },
        preferences: {
          balanceSubjectDistribution: true,
          preferMorningForCore: true,
          avoidLastPeriodForLab: true,
          groupSameSubjectDays: false,
        },
      },
    }
  )

  console.log(
    `${tag} Algorithm result: ${result.slots.length} slots, ${result.slots.filter((s) => s.teacherId).length} with teacher, ${result.warnings.length} warnings, ${result.errors.length} errors`
  )
  if (result.errors.length > 0) {
    console.error(`${tag} Algorithm errors:`, result.errors)
  }
  if (result.warnings.length > 0) {
    console.warn(`${tag} Algorithm warnings:`, result.warnings)
  }

  if (result.slots.length === 0) {
    return {
      success: false,
      slotsCreated: 0,
      warnings: ["Algorithm produced 0 slots", ...result.warnings],
    }
  }

  // 9. Save slots
  const created = await db.timetable.createMany({
    data: result.slots.map((slot) => ({
      schoolId,
      termId: activeTerm.id,
      dayOfWeek: slot.dayOfWeek,
      periodId: slot.periodId,
      sectionId: slot.sectionId || undefined,
      subjectId: slot.subjectId || undefined,
      classId: slot.classId || undefined,
      // Persist the teacher the algorithm assigned (was hardcoded undefined,
      // which discarded every assignment); stays null where none was free.
      teacherId: slot.teacherId ?? undefined,
      classroomId: slot.classroomId,
      weekOffset: 0,
      constraintViolations: slot.violations,
    })),
    skipDuplicates: true,
  })

  console.log(
    `[autoGenerateTimetableForSchool] Created ${created.count} timetable slots for school ${schoolId}`
  )

  return {
    success: true,
    slotsCreated: created.count,
    warnings: result.warnings,
  }
}

// ============================================================================
// setupLibraryForSchool — Auto-provision catalog books for a new school
// ============================================================================

const DEFAULT_COPIES_PER_BOOK = 3

/**
 * Auto-provision library books from the global catalog for a new school.
 * Creates BookSelection + Book records for all public, approved catalog books.
 * Idempotent — skips if school already has books.
 *
 * NOT part of automatic onboarding/repair: book adoption is a school decision
 * made through the library picker. Available for manual provisioning from the
 * SaaS dashboard.
 */
export async function setupLibraryForSchool(schoolId: string) {
  // Idempotent: skip if school already has books
  const existingBooks = await db.schoolBook.count({ where: { schoolId } })
  if (existingBooks > 0) {
    return {
      skipped: true,
      books: 0,
      message: "School already has library books",
    }
  }

  // Get all public, approved, published catalog books
  const catalogBooks = await db.book.findMany({
    where: {
      status: "PUBLISHED",
      approvalStatus: "APPROVED",
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      title: true,
      author: true,
      genre: true,
      description: true,
      summary: true,
      coverUrl: true,
      coverColor: true,
      rating: true,
      videoUrl: true,
      isbn: true,
      publisher: true,
      publicationYear: true,
      language: true,
      pageCount: true,
      gradeLevel: true,
    },
  })

  if (catalogBooks.length === 0) {
    return { skipped: true, books: 0, message: "No catalog books available" }
  }

  const result = await db.$transaction(
    async (tx) => {
      let bookCount = 0

      for (const cb of catalogBooks) {
        // Check for existing selection to prevent unique constraint violation
        const existingSelection = await tx.bookSelection.findFirst({
          where: { schoolId, catalogBookId: cb.id },
        })
        if (existingSelection) continue

        await tx.bookSelection.create({
          data: {
            schoolId,
            catalogBookId: cb.id,
            totalCopies: DEFAULT_COPIES_PER_BOOK,
            availableCopies: DEFAULT_COPIES_PER_BOOK,
            isActive: true,
          },
        })

        await tx.schoolBook.create({
          data: {
            schoolId,
            catalogBookId: cb.id,
            title: cb.title,
            author: cb.author,
            genre: cb.genre,
            description: cb.description ?? "",
            summary: cb.summary ?? "",
            coverUrl: cb.coverUrl ?? "",
            coverColor: cb.coverColor,
            rating: Math.round(cb.rating),
            totalCopies: DEFAULT_COPIES_PER_BOOK,
            availableCopies: DEFAULT_COPIES_PER_BOOK,
            videoUrl: cb.videoUrl,
            isbn: cb.isbn,
            publisher: cb.publisher,
            publicationYear: cb.publicationYear,
            language: cb.language,
            pageCount: cb.pageCount,
            gradeLevel: cb.gradeLevel,
          },
        })

        bookCount++
      }

      return bookCount
    },
    { timeout: 60000 }
  )

  // Update usage counts outside transaction (non-critical metadata)
  try {
    const catalogBookIds = catalogBooks.map((cb) => cb.id)
    for (const catalogBookId of catalogBookIds) {
      const usageCount = await db.bookSelection.count({
        where: { catalogBookId },
      })
      await db.book.update({
        where: { id: catalogBookId },
        data: { usageCount },
      })
    }
  } catch {
    // Non-critical: usage count is just metadata
  }

  return { skipped: false, books: result }
}

// ============================================================================
// Provisioning doctor — detect and repair partially provisioned schools
// ============================================================================

/** Stages the doctor can detect as missing and repair, in dependency order. */
export type ProvisioningStage =
  | "defaults"
  | "academicStructure"
  | "subjectSelections"
  | "schedule"
  | "sections"
  | "timetable"
  | "joinCode"

export interface ProvisioningStatus {
  counts: {
    yearLevels: number
    departments: number
    scoreRanges: number
    academicLevels: number
    academicGrades: number
    academicStreams: number
    subjectSelections: number
    schoolYears: number
    periods: number
    terms: number
    weekConfigs: number
    classroomTypes: number
    sections: number
    timetableSlots: number
    libraryBooks: number
  }
  hasJoinCode: boolean
  timetableStructure: string | null
  missing: ProvisioningStage[]
  healthy: boolean
}

export interface RepairResult {
  repaired: ProvisioningStage[]
  failed: Array<{ stage: ProvisioningStage; error: string }>
  healthy: boolean
  status: ProvisioningStatus
}

/**
 * Read-only health check of every provisioning stage for a school.
 * One batched round of counts — safe to call from operator dashboards.
 *
 * `libraryBooks` and `academicStreams` are reported but never marked missing:
 * book adoption is a school decision, and streams exist only for curricula
 * that define them.
 */
export async function getProvisioningStatus(
  schoolId: string
): Promise<ProvisioningStatus> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timetableStructure: true, joinCode: true },
  })
  if (!school) throw new Error("school_not_found")

  const [
    yearLevels,
    departments,
    scoreRanges,
    academicLevels,
    academicGrades,
    academicStreams,
    subjectSelections,
    schoolYears,
    periods,
    terms,
    weekConfigs,
    classroomTypes,
    sections,
    timetableSlots,
    libraryBooks,
  ] = await Promise.all([
    db.yearLevel.count({ where: { schoolId } }),
    db.department.count({ where: { schoolId } }),
    db.scoreRange.count({ where: { schoolId } }),
    db.academicLevel.count({ where: { schoolId } }),
    db.academicGrade.count({ where: { schoolId } }),
    db.academicStream.count({ where: { schoolId } }),
    db.subjectSelection.count({ where: { schoolId, isActive: true } }),
    db.schoolYear.count({ where: { schoolId } }),
    db.period.count({ where: { schoolId } }),
    db.term.count({ where: { schoolId } }),
    db.schoolWeekConfig.count({ where: { schoolId } }),
    db.classroomType.count({ where: { schoolId } }),
    db.section.count({ where: { schoolId } }),
    db.timetable.count({ where: { schoolId } }),
    db.schoolBook.count({ where: { schoolId } }),
  ])

  const missing: ProvisioningStage[] = []
  if (yearLevels === 0 || departments === 0 || scoreRanges === 0)
    missing.push("defaults")
  if (academicLevels === 0 || academicGrades === 0)
    missing.push("academicStructure")
  if (subjectSelections === 0) missing.push("subjectSelections")
  // Schedule + timetable are no longer gated on a pre-selected
  // `timetableStructure`: every school auto-provisions a timetable with zero
  // clicks. When the school never picked a structure, the schedule stage
  // resolves a country-recommended default (see `repairProvisioning`).
  if (periods === 0 || terms === 0 || weekConfigs === 0)
    missing.push("schedule")
  if (sections === 0 || classroomTypes === 0) missing.push("sections")
  if (timetableSlots === 0) missing.push("timetable")
  if (!school.joinCode) missing.push("joinCode")

  return {
    counts: {
      yearLevels,
      departments,
      scoreRanges,
      academicLevels,
      academicGrades,
      academicStreams,
      subjectSelections,
      schoolYears,
      periods,
      terms,
      weekConfigs,
      classroomTypes,
      sections,
      timetableSlots,
      libraryBooks,
    },
    hasJoinCode: Boolean(school.joinCode),
    timetableStructure: school.timetableStructure,
    missing,
    healthy: missing.length === 0,
  }
}

/**
 * Run only the missing provisioning stages for a school, in dependency order.
 * Every underlying step is idempotent, so re-running after a partial failure
 * (serverless timeout mid-onboarding, a single failed stage) completes the
 * remainder without duplicating anything.
 *
 * One stage failing never aborts the rest — failures are collected and
 * reported so the caller (onboarding `after()`, operator repair button) can
 * surface or log them.
 */
export async function repairProvisioning(
  schoolId: string
): Promise<RepairResult> {
  const before = await getProvisioningStatus(schoolId)

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: {
      country: true,
      schoolType: true,
      schoolLevel: true,
      timetableStructure: true,
    },
  })
  if (!school) throw new Error("school_not_found")

  // Resolve the structure slug once (explicit choice or country default) and
  // persist it so future status checks + manual flows stay stable.
  const effectiveSlug = await resolveEffectiveStructureSlug(school)
  if (!school.timetableStructure) {
    try {
      await db.school.update({
        where: { id: schoolId },
        data: { timetableStructure: effectiveSlug },
      })
    } catch {
      // Non-fatal: provisioning can still proceed with the resolved slug.
    }
  }

  const repaired: ProvisioningStage[] = []
  const failed: Array<{ stage: ProvisioningStage; error: string }> = []

  const run = async (stage: ProvisioningStage, fn: () => Promise<unknown>) => {
    if (!before.missing.includes(stage)) return
    try {
      await fn()
      repaired.push(stage)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[repairProvisioning:${stage}] ${schoolId}: ${message}`)
      failed.push({ stage, error: message })
    }
  }

  // Order matters: defaults create YearLevels that the academic structure
  // links to; grades must exist before sections; sections + periods + terms
  // + selections must exist before timetable generation.
  await run("defaults", () =>
    setupDefaultsForSchool(schoolId, school.schoolLevel || "both")
  )

  await run("academicStructure", () =>
    setupCatalogForSchool(schoolId, {
      country: school.country || undefined,
      schoolType: school.schoolType || undefined,
    })
  )

  await run("subjectSelections", async () => {
    // setupCatalogForSchool already creates selections — only self-heal when
    // they are still absent (structure pre-existed without selections).
    const count = await db.subjectSelection.count({
      where: { schoolId, isActive: true },
    })
    if (count === 0) await ensureSubjectSelections(schoolId)
  })

  await run("schedule", async () => {
    const result = await applyTimetableStructureForNewSchool(
      schoolId,
      effectiveSlug
    )
    // { skipped: true } means the slug was unrecognised — surface as failure
    if (result && "skipped" in result && result.skipped) {
      throw new Error(
        (result as { skipped: true; message: string }).message ??
          "unknown_structure_slug"
      )
    }
  })

  await run("sections", async () => {
    await db.classroomType.upsert({
      where: { schoolId_name: { schoolId, name: "Classroom" } },
      create: { schoolId, name: "Classroom" },
      update: {},
    })
    await autoProvisionSections(schoolId)
  })

  await run("timetable", async () => {
    const result = await autoGenerateTimetableForSchool(schoolId)
    if (!result.success) {
      throw new Error(result.warnings.join("; ") || "timetable_not_generated")
    }
  })

  await run("joinCode", async () => {
    const joinCode = await generateUniqueJoinCode()
    await db.school.update({ where: { id: schoolId }, data: { joinCode } })
  })

  const status = await getProvisioningStatus(schoolId)
  return { repaired, failed, healthy: status.healthy, status }
}
