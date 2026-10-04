// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Loads everything the section timetable generator needs for one term.
 *
 * Shared by onboarding's `autoGenerateTimetableForSchool` and the Generate
 * page's preview, which used to carry two drifting copies of this loader (one
 * ignored teacher/room constraints, neither ordered its sections, so results
 * changed between runs).
 *
 * Plain server module — deliberately NOT "use server": every export of a
 * "use server" file becomes a public POST endpoint.
 */

import { db } from "@/lib/db"

import type {
  GenerationConfig,
  RoomAvailability,
  SectionRequirement,
  TeacherAvailability,
} from "./algorithm"
import { buildTeacherPlan, type TeacherCap } from "./teacher-plan"

const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4] // Sun–Thu
const DEFAULT_HOURS_PER_WEEK = 3

export interface GenerationOverrides {
  constraints?: Partial<GenerationConfig["constraints"]>
  preferences?: Partial<GenerationConfig["preferences"]>
}

export interface GenerationInputs {
  config: GenerationConfig
  sections: SectionRequirement[]
  teachers: TeacherAvailability[]
  rooms: RoomAvailability[]
  cap: TeacherCap
  placeholderCount: number
  /** Real (hired) teachers only — placeholders excluded. */
  realTeacherCount: number
  sectionNames: Record<string, string>
  subjectNames: Record<string, string>
}

export async function buildGenerationInputs(params: {
  schoolId: string
  termId: string
  yearId: string
  overrides?: GenerationOverrides
  /**
   * Who may teach a subject in a section:
   * - "assignments" (default) — only the teacher assigned to that subject in
   *   that section (SubjectTeacher); an unassigned pair waits for a teacher.
   * - "expertise" — any active teacher qualified for the subject (the
   *   pre-assignment behaviour, kept for callers that want it).
   */
  pinSource?: "assignments" | "expertise"
}): Promise<GenerationInputs> {
  const { schoolId, termId, yearId, overrides } = params
  const pinSource = params.pinSource ?? "assignments"

  const [
    periods,
    weekConfig,
    workload,
    sectionRows,
    selections,
    teacherRows,
    roomRows,
    assignments,
  ] = await Promise.all([
    db.period.findMany({
      where: { schoolId, yearId },
      orderBy: { startTime: "asc" },
      select: { id: true, isBreak: true },
    }),
    db.schoolWeekConfig.findFirst({
      where: { schoolId, OR: [{ termId }, { termId: null }] },
      orderBy: { termId: "desc" },
      select: { workingDays: true },
    }),
    db.workloadConfig.findUnique({
      where: { schoolId },
      select: { maxPeriodsPerWeek: true },
    }),
    db.section.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        letter: true,
        gradeId: true,
        classroomId: true,
        grade: { select: { gradeNumber: true } },
        _count: { select: { students: true } },
      },
    }),
    db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: {
        catalogSubjectId: true,
        gradeId: true,
        weeklyPeriods: true,
        subject: { select: { name: true } },
      },
    }),
    db.teacher.findMany({
      where: { schoolId, employmentStatus: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        subjectExpertise: {
          where: { schoolId },
          select: { subjectId: true },
        },
        constraints: {
          where: { schoolId, OR: [{ termId }, { termId: null }] },
          orderBy: { termId: "desc" },
          take: 1,
          select: {
            maxPeriodsPerDay: true,
            maxPeriodsPerWeek: true,
            maxConsecutivePeriods: true,
            periodPreferences: true,
            unavailableBlocks: { select: { dayOfWeek: true, periodId: true } },
          },
        },
      },
    }),
    db.classroom.findMany({
      where: { schoolId },
      select: {
        id: true,
        roomName: true,
        capacity: true,
        classroomType: { select: { name: true } },
        constraints: {
          where: { schoolId, OR: [{ termId }, { termId: null }] },
          orderBy: { termId: "desc" },
          take: 1,
          select: { allowedSubjectTypes: true, reservedPeriods: true },
        },
      },
    }),
    pinSource === "assignments"
      ? db.subjectTeacher.findMany({
          where: { schoolId, termId },
          select: { sectionId: true, subjectId: true, teacherId: true },
        })
      : Promise.resolve([]),
  ])

  const constraints = overrides?.constraints
  const preferences = overrides?.preferences
  const config: GenerationConfig = {
    workingDays:
      Array.isArray(weekConfig?.workingDays) &&
      weekConfig.workingDays.length > 0
        ? weekConfig.workingDays
        : DEFAULT_WORKING_DAYS,
    // Read the column, never the name: a break called «فسحة» is still a break.
    periodsPerDay: periods.filter((p) => !p.isBreak).map((p) => p.id),
    constraints: {
      enforceTeacherExpertise: constraints?.enforceTeacherExpertise ?? true,
      enforceRoomCapacity: constraints?.enforceRoomCapacity ?? true,
      maxTeacherPeriodsPerDay: constraints?.maxTeacherPeriodsPerDay ?? 6,
      maxTeacherPeriodsPerWeek:
        constraints?.maxTeacherPeriodsPerWeek ??
        workload?.maxPeriodsPerWeek ??
        25,
      maxConsecutivePeriods: constraints?.maxConsecutivePeriods ?? 3,
      requireLunchBreak: constraints?.requireLunchBreak ?? true,
      preventBackToBack: constraints?.preventBackToBack ?? false,
    },
    preferences: {
      balanceSubjectDistribution:
        preferences?.balanceSubjectDistribution ?? true,
      preferMorningForCore: preferences?.preferMorningForCore ?? true,
      avoidLastPeriodForLab: preferences?.avoidLastPeriodForLab ?? true,
      groupSameSubjectDays: preferences?.groupSameSubjectDays ?? false,
    },
  }

  const cap: TeacherCap = {
    perWeek: config.constraints.maxTeacherPeriodsPerWeek,
    perDay: config.constraints.maxTeacherPeriodsPerDay,
    consecutive: config.constraints.maxConsecutivePeriods,
  }

  // Subjects per grade, one entry per subject. Stream-specific selections can
  // list the same subject more than once for a grade; keep the largest load.
  const subjectNames: Record<string, string> = {}
  const gradeSubjects = new Map<string, Map<string, number>>()
  for (const sel of selections) {
    if (!sel.subject) continue
    subjectNames[sel.catalogSubjectId] = sel.subject.name
    const bySubject = gradeSubjects.get(sel.gradeId) ?? new Map()
    const hours = sel.weeklyPeriods ?? DEFAULT_HOURS_PER_WEEK
    bySubject.set(
      sel.catalogSubjectId,
      Math.max(bySubject.get(sel.catalogSubjectId) ?? 0, hours)
    )
    gradeSubjects.set(sel.gradeId, bySubject)
  }

  // Qualified real teachers per subject (active teachers only) — used in
  // "expertise" mode.
  const qualified = new Map<string, string[]>()
  for (const t of teacherRows) {
    for (const e of t.subjectExpertise) {
      const list = qualified.get(e.subjectId) ?? []
      list.push(t.id)
      qualified.set(e.subjectId, list)
    }
  }
  // The assigned teacher per (section, subject) — "assignments" mode. Only
  // active teachers: an inactive one's subjects wait for a new teacher.
  const activeIds = new Set(teacherRows.map((t) => t.id))
  const assigned = new Map(
    assignments
      .filter((a) => activeIds.has(a.teacherId))
      .map((a) => [`${a.sectionId}:${a.subjectId}`, a.teacherId])
  )
  const teachersFor = (sectionId: string, subjectId: string): string[] => {
    if (pinSource === "expertise") return qualified.get(subjectId) ?? []
    const teacherId = assigned.get(`${sectionId}:${subjectId}`)
    return teacherId ? [teacherId] : []
  }

  const teachers: TeacherAvailability[] = teacherRows.map((t) => {
    const c = t.constraints[0]
    const periodPrefs = (c?.periodPreferences as Record<string, string>) || {}
    return {
      teacherId: t.id,
      teacherName: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
      maxPeriodsPerDay: c?.maxPeriodsPerDay || cap.perDay,
      maxPeriodsPerWeek: c?.maxPeriodsPerWeek || cap.perWeek,
      maxConsecutive: c?.maxConsecutivePeriods || cap.consecutive,
      subjectExpertise: t.subjectExpertise.map((e) => e.subjectId),
      unavailableBlocks: c?.unavailableBlocks ?? [],
      preferredPeriods: Object.entries(periodPrefs)
        .filter(([, v]) => v === "preferred")
        .map(([periodId]) => ({ dayOfWeek: 0, periodId })),
      avoidedPeriods: Object.entries(periodPrefs)
        .filter(([, v]) => v === "avoid")
        .map(([periodId]) => ({ dayOfWeek: 0, periodId })),
    }
  })

  // Stable order: grade number, then section letter. The generator is greedy,
  // so an unordered list made every run come out different.
  const orderedSections = [...sectionRows].sort(
    (a, b) =>
      (a.grade?.gradeNumber ?? 0) - (b.grade?.gradeNumber ?? 0) ||
      a.letter.localeCompare(b.letter) ||
      a.name.localeCompare(b.name)
  )

  const sectionNames: Record<string, string> = {}
  const baseSections: SectionRequirement[] = orderedSections.map((s) => {
    sectionNames[s.id] = s.name
    const bySubject = gradeSubjects.get(s.gradeId) ?? new Map<string, number>()
    return {
      sectionId: s.id,
      sectionName: s.name,
      gradeId: s.gradeId,
      classroomId: s.classroomId,
      studentCount: s._count.students,
      subjects: [...bySubject.entries()].map(([subjectId, hoursPerWeek]) => ({
        subjectId,
        subjectName: subjectNames[subjectId] ?? "",
        hoursPerWeek,
        requiresLab: (subjectNames[subjectId] ?? "")
          .toLowerCase()
          .includes("lab"),
        preferredTeacherIds: teachersFor(s.id, subjectId),
      })),
    }
  })

  const plan = buildTeacherPlan({
    sections: baseSections,
    teachers,
    cap,
    placeholdersFor: pinSource === "assignments" ? "unstaffed" : "all",
  })

  const rooms: RoomAvailability[] = roomRows.map((r) => {
    const c = r.constraints[0]
    const reserved = (c?.reservedPeriods as Record<string, string[]>) || {}
    const reservedBlocks: Array<{ dayOfWeek: number; periodId: string }> = []
    for (const [dayStr, periodIds] of Object.entries(reserved)) {
      for (const periodId of periodIds) {
        reservedBlocks.push({ dayOfWeek: parseInt(dayStr, 10), periodId })
      }
    }
    return {
      roomId: r.id,
      roomName: r.roomName,
      capacity: r.capacity || 30,
      roomType: r.classroomType?.name || "regular",
      allowedSubjectTypes: c?.allowedSubjectTypes || [],
      reservedBlocks,
      hasAccessibility: false,
    }
  })

  return {
    config,
    sections: plan.sections,
    teachers: plan.teachers,
    rooms,
    cap,
    placeholderCount: plan.placeholderCount,
    realTeacherCount: teachers.length,
    sectionNames,
    subjectNames,
  }
}
