// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  __testing,
  generateSectionTimetable,
  generateTimetable,
  type ClassRequirement,
  type GeneratedSlot,
  type GenerationConfig,
  type GenerationInput,
  type RoomAvailability,
  type SectionRequirement,
  type TeacherAvailability,
} from "../generate/algorithm"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeConfig(over: Partial<GenerationConfig> = {}): GenerationConfig {
  return {
    workingDays: [0, 1],
    periodsPerDay: ["p1", "p2"],
    constraints: {
      enforceTeacherExpertise: true,
      enforceRoomCapacity: false,
      maxTeacherPeriodsPerDay: 10,
      maxTeacherPeriodsPerWeek: 40,
      maxConsecutivePeriods: 10,
      requireLunchBreak: false,
      preventBackToBack: false,
    },
    preferences: {
      balanceSubjectDistribution: false,
      preferMorningForCore: false,
      avoidLastPeriodForLab: false,
      groupSameSubjectDays: false,
    },
    ...over,
  }
}

function makeInput(config: GenerationConfig): GenerationInput {
  return { schoolId: "s1", termId: "t1", yearId: "y1", config }
}

function teacher(over: Partial<TeacherAvailability> = {}): TeacherAvailability {
  return {
    teacherId: "teach1",
    teacherName: "Teacher One",
    maxPeriodsPerDay: 10,
    maxPeriodsPerWeek: 40,
    maxConsecutive: 10,
    subjectExpertise: ["math"],
    unavailableBlocks: [],
    preferredPeriods: [],
    avoidedPeriods: [],
    ...over,
  }
}

function room(over: Partial<RoomAvailability> = {}): RoomAvailability {
  return {
    roomId: "room1",
    roomName: "Room One",
    capacity: 30,
    roomType: "regular",
    allowedSubjectTypes: [],
    reservedBlocks: [],
    hasAccessibility: false,
    ...over,
  }
}

function section(over: Partial<SectionRequirement> = {}): SectionRequirement {
  return {
    sectionId: "sec1",
    sectionName: "Grade 1-A",
    gradeId: "g1",
    classroomId: "room1",
    studentCount: 20,
    subjects: [
      {
        subjectId: "math",
        subjectName: "Math",
        hoursPerWeek: 2,
        requiresLab: false,
        preferredTeacherIds: ["teach1"],
      },
    ],
    ...over,
  }
}

function slotKey(s: GeneratedSlot) {
  return `${s.dayOfWeek}:${s.periodId}:${s.sectionId}`
}

// ---------------------------------------------------------------------------
// generateSectionTimetable — end-to-end invariants
// ---------------------------------------------------------------------------

describe("generateSectionTimetable", () => {
  it("places every required slot when capacity is ample", () => {
    const config = makeConfig()
    const result = generateSectionTimetable(
      [section()],
      [teacher()],
      [room()],
      makeInput(config)
    )

    expect(result.slots).toHaveLength(2)
    expect(result.unplacedClasses).toEqual([])
    expect(result.success).toBe(true)
  })

  it("never double-books a section in the same day/period", () => {
    const config = makeConfig()
    const result = generateSectionTimetable(
      [
        section({
          subjects: [
            {
              subjectId: "math",
              subjectName: "Math",
              hoursPerWeek: 2,
              requiresLab: false,
              preferredTeacherIds: ["teach1"],
            },
            {
              subjectId: "sci",
              subjectName: "Science",
              hoursPerWeek: 2,
              requiresLab: false,
              preferredTeacherIds: ["teach2"],
            },
          ],
        }),
      ],
      [teacher(), teacher({ teacherId: "teach2", subjectExpertise: ["sci"] })],
      [room()],
      makeInput(config)
    )

    const keys = result.slots.map(slotKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("never double-books a teacher across sections", () => {
    const config = makeConfig({
      workingDays: [0, 1, 2],
      periodsPerDay: ["p1", "p2"],
    })
    const result = generateSectionTimetable(
      [
        section({ sectionId: "secA", sectionName: "A" }),
        section({ sectionId: "secB", sectionName: "B" }),
      ],
      [teacher()], // single shared math teacher
      [room(), room({ roomId: "room2", roomName: "Room Two" })],
      makeInput(config)
    )

    const seen = new Set<string>()
    for (const s of result.slots) {
      if (!s.teacherId) continue
      const k = `${s.dayOfWeek}:${s.periodId}:${s.teacherId}`
      expect(seen.has(k)).toBe(false)
      seen.add(k)
    }
  })

  it("only assigns teachers who have the subject expertise", () => {
    const config = makeConfig({ constraints: { ...makeConfig().constraints } })
    const result = generateSectionTimetable(
      [section()],
      [teacher()], // expertise: ["math"]
      [room()],
      makeInput(config)
    )

    for (const s of result.slots) {
      if (s.teacherId) {
        expect(s.teacherId).toBe("teach1")
      }
    }
  })

  it("reports unplaced sections when the week is over-subscribed", () => {
    const config = makeConfig({ workingDays: [0], periodsPerDay: ["p1"] })
    const result = generateSectionTimetable(
      [
        section({
          subjects: [
            {
              subjectId: "math",
              subjectName: "Math",
              hoursPerWeek: 3, // only 1 slot exists
              requiresLab: false,
              preferredTeacherIds: ["teach1"],
            },
          ],
        }),
      ],
      [teacher()],
      [room()],
      makeInput(config)
    )

    expect(result.unplacedClasses).toContain("sec1")
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.success).toBe(false)
  })

  it("legacy generateTimetable wrapper produces section slots", () => {
    const config = makeConfig()
    const requirements: ClassRequirement[] = [
      {
        classId: "class1",
        className: "Class 1",
        subjectId: "math",
        name: "Math",
        hoursPerWeek: 2,
        preferredTeacherIds: ["teach1"],
        requiresLab: false,
        yearLevelId: "g1",
        studentCount: 20,
      },
    ]
    const result = generateTimetable(
      requirements,
      [teacher()],
      [room()],
      makeInput(config)
    )
    expect(result.slots.length).toBeGreaterThan(0)
    expect(result.slots.every((s) => s.sectionId === "class1")).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// __testing unit helpers
// ---------------------------------------------------------------------------

describe("algorithm __testing helpers", () => {
  function emptyState() {
    return {
      slots: new Map(),
      teacherSchedule: new Map(),
      roomSchedule: new Map(),
      sectionSchedule: new Map(),
      subjectCounts: new Map(),
    } as any
  }

  function gslot(over: Partial<GeneratedSlot> = {}): GeneratedSlot {
    return {
      dayOfWeek: 0,
      periodId: "p1",
      sectionId: "sec1",
      subjectId: "math",
      classId: "",
      teacherId: "teach1",
      classroomId: "room1",
      score: 100,
      violations: [],
      ...over,
    }
  }

  it("addSlot then removeSlot round-trips section scheduling", () => {
    const state = emptyState()
    const slot = gslot()

    expect(__testing.isSectionScheduled("sec1", 0, "p1", state)).toBe(false)
    __testing.addSlot(slot, state)
    expect(__testing.isSectionScheduled("sec1", 0, "p1", state)).toBe(true)
    __testing.removeSlot(slot, state)
    expect(__testing.isSectionScheduled("sec1", 0, "p1", state)).toBe(false)
  })

  it("isTeacherAvailable flips to false once the teacher is booked", () => {
    const state = emptyState()
    const config = makeConfig()
    const t = teacher()

    expect(__testing.isTeacherAvailable(t, 0, "p1", state, config)).toBe(true)
    __testing.addSlot(gslot(), state)
    expect(__testing.isTeacherAvailable(t, 0, "p1", state, config)).toBe(false)
    // Still free in a different period.
    expect(__testing.isTeacherAvailable(t, 0, "p2", state, config)).toBe(true)
  })

  it("isTeacherAvailable respects unavailable blocks", () => {
    const state = emptyState()
    const config = makeConfig()
    const t = teacher({ unavailableBlocks: [{ dayOfWeek: 0, periodId: "p1" }] })
    expect(__testing.isTeacherAvailable(t, 0, "p1", state, config)).toBe(false)
    expect(__testing.isTeacherAvailable(t, 1, "p1", state, config)).toBe(true)
  })

  it("isRoomAvailable respects reserved blocks", () => {
    const state = emptyState()
    const r = room({ reservedBlocks: [{ dayOfWeek: 0, periodId: "p1" }] })
    expect(__testing.isRoomAvailable(r, 0, "p1", state)).toBe(false)
    expect(__testing.isRoomAvailable(r, 1, "p1", state)).toBe(true)
  })
})
