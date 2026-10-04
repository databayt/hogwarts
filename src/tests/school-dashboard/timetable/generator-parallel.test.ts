// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The real generator, run the way onboarding runs it for a school with no
 * teachers yet. Before placeholder teachers, parallel sections came out as
 * copies (alabidae: 100% of slots had 7-A and 7-B on the same subject at the
 * same period), so one teacher taking a subject for both sections clashed on
 * every period.
 */

import { describe, expect, it } from "vitest"

import {
  generateSectionTimetable,
  type GeneratedSlot,
  type GenerationConfig,
  type RoomAvailability,
  type SectionRequirement,
  type TeacherAvailability,
} from "@/components/school-dashboard/timetable/generate/algorithm"
import {
  buildTeacherPlan,
  isPlaceholderTeacherId,
  stripPlaceholderTeachers,
} from "@/components/school-dashboard/timetable/generate/teacher-plan"

const PERIODS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]
const CONFIG: GenerationConfig = {
  workingDays: [0, 1, 2, 3, 4],
  periodsPerDay: PERIODS,
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
}
const CAP = { perWeek: 25, perDay: 6, consecutive: 3 }

// A Sudan-like grade: 30 periods a week, no subject above 5 (the generator
// places a subject at most once a day).
const SUBJECTS: Array<[string, number]> = [
  ["arabic", 5],
  ["math", 5],
  ["english", 5],
  ["science", 4],
  ["islamic", 4],
  ["social", 3],
  ["art", 2],
  ["pe", 2],
]

function school(gradeSections: Record<string, number>) {
  const sections: SectionRequirement[] = []
  const rooms: RoomAvailability[] = []
  for (const [gradeId, count] of Object.entries(gradeSections)) {
    for (let i = 0; i < count; i++) {
      const sectionId = `${gradeId}-${String.fromCharCode(65 + i)}`
      const roomId = `room-${sectionId}`
      rooms.push({
        roomId,
        roomName: roomId,
        capacity: 30,
        roomType: "classroom",
        allowedSubjectTypes: [],
        reservedBlocks: [],
        hasAccessibility: false,
      })
      sections.push({
        sectionId,
        sectionName: sectionId,
        gradeId,
        classroomId: roomId,
        studentCount: 0,
        subjects: SUBJECTS.map(([subjectId, hoursPerWeek]) => ({
          subjectId,
          subjectName: subjectId,
          hoursPerWeek,
          requiresLab: false,
          preferredTeacherIds: [],
        })),
      })
    }
  }
  return { sections, rooms }
}

function run(
  sections: SectionRequirement[],
  teachers: TeacherAvailability[],
  rooms: RoomAvailability[]
) {
  return generateSectionTimetable(sections, teachers, rooms, {
    schoolId: "school",
    termId: "term",
    yearId: "year",
    config: CONFIG,
  })
}

/** Slots that share (grade, subject, day, period) with another section. */
function parallelClashes(
  slots: GeneratedSlot[],
  sections: SectionRequirement[]
): number {
  const gradeOf = new Map(sections.map((s) => [s.sectionId, s.gradeId]))
  const groups = new Map<string, number>()
  for (const s of slots) {
    const key = `${gradeOf.get(s.sectionId)}|${s.subjectId}|${s.dayOfWeek}|${s.periodId}`
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  let clashes = 0
  for (const count of groups.values()) if (count > 1) clashes += count
  return clashes
}

describe("section timetable generation for a school with no teachers", () => {
  it("without placeholders, parallel sections mirror each other (the bug)", () => {
    const { sections, rooms } = school({ g7: 2 })
    const result = run(sections, [], rooms)
    expect(parallelClashes(result.slots, sections)).toBe(result.slots.length)
  })

  it("with placeholders, two parallel sections never share a subject's period", () => {
    const { sections, rooms } = school({ g7: 2, g8: 2 })
    const plan = buildTeacherPlan({ sections, teachers: [], cap: CAP })
    const result = run(plan.sections, plan.teachers, rooms)
    const slots = stripPlaceholderTeachers(result.slots)

    expect(result.stats.placedSlots).toBe(result.stats.totalSlots)
    expect(parallelClashes(slots, sections)).toBe(0)
    expect(slots.every((s) => s.teacherId === null)).toBe(true)
    expect(slots.some((s) => isPlaceholderTeacherId(s.teacherId))).toBe(false)
  })

  // Greedy placement leaves the last sections of a large grade few free
  // periods, so a handful of leftovers remain. Assigning a teacher repairs
  // them by swapping periods inside the section.
  it.each([3, 4])(
    "with placeholders, %i parallel sections place everything with few leftover clashes",
    (count) => {
      const { sections, rooms } = school({ g7: count, g8: count })
      const baseline = run(sections, [], rooms)
      const plan = buildTeacherPlan({ sections, teachers: [], cap: CAP })
      const result = run(plan.sections, plan.teachers, rooms)
      const slots = stripPlaceholderTeachers(result.slots)

      expect(result.stats.placedSlots).toBe(result.stats.totalSlots)
      expect(parallelClashes(baseline.slots, sections)).toBe(
        baseline.slots.length
      )
      expect(parallelClashes(slots, sections)).toBeLessThanOrEqual(
        slots.length * 0.1
      )
    }
  )

  it("places every period of a two-period subject, not just the first three days", () => {
    const { sections, rooms } = school({ g7: 1 })
    const result = run(sections, [], rooms)
    expect(result.stats.placedSlots).toBe(result.stats.totalSlots)
    expect(result.warnings).toEqual([])
  })

  it("still gives a real qualified teacher their periods, never double-booked", () => {
    const { sections, rooms } = school({ g7: 2 })
    const mathTeacher: TeacherAvailability = {
      teacherId: "t-math",
      teacherName: "Math teacher",
      maxPeriodsPerDay: 6,
      maxPeriodsPerWeek: 25,
      maxConsecutive: 3,
      subjectExpertise: ["math"],
      unavailableBlocks: [],
      preferredPeriods: [],
      avoidedPeriods: [],
    }
    const withMath = sections.map((s) => ({
      ...s,
      subjects: s.subjects.map((sub) =>
        sub.subjectId === "math"
          ? { ...sub, preferredTeacherIds: ["t-math"] }
          : sub
      ),
    }))

    const plan = buildTeacherPlan({
      sections: withMath,
      teachers: [mathTeacher],
      cap: CAP,
    })
    const slots = stripPlaceholderTeachers(
      run(plan.sections, plan.teachers, rooms).slots
    )

    const taught = slots.filter((s) => s.teacherId === "t-math")
    expect(taught).toHaveLength(10) // 5 periods × 2 sections
    const times = new Set(taught.map((s) => `${s.dayOfWeek}|${s.periodId}`))
    expect(times.size).toBe(taught.length)
    expect(parallelClashes(slots, sections)).toBe(0)
  })
})
