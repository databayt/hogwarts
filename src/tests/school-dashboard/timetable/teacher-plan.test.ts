// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import type {
  GeneratedSlot,
  SectionRequirement,
  TeacherAvailability,
} from "@/components/school-dashboard/timetable/generate/algorithm"
import {
  bucketSections,
  buildTeacherPlan,
  isPlaceholderTeacherId,
  PLACEHOLDER_TEACHER_PREFIX,
  stripPlaceholderTeachers,
} from "@/components/school-dashboard/timetable/generate/teacher-plan"

const CAP = { perWeek: 25, perDay: 6, consecutive: 3 }

function section(
  sectionId: string,
  gradeId: string,
  subjects: Array<[string, number, string[]?]>
): SectionRequirement {
  return {
    sectionId,
    sectionName: sectionId,
    gradeId,
    classroomId: `room-${sectionId}`,
    studentCount: 0,
    subjects: subjects.map(([subjectId, hoursPerWeek, teachers]) => ({
      subjectId,
      subjectName: subjectId,
      hoursPerWeek,
      requiresLab: false,
      preferredTeacherIds: teachers ?? [],
    })),
  }
}

function realTeacher(id: string, subjects: string[]): TeacherAvailability {
  return {
    teacherId: id,
    teacherName: id,
    maxPeriodsPerDay: 6,
    maxPeriodsPerWeek: 25,
    maxConsecutive: 3,
    subjectExpertise: subjects,
    unavailableBlocks: [],
    preferredPeriods: [],
    avoidedPeriods: [],
  }
}

describe("bucketSections", () => {
  it("keeps every section of a grade together while the load fits one teacher", () => {
    expect(
      bucketSections(
        [
          { sectionId: "7A", hours: 5 },
          { sectionId: "7B", hours: 5 },
          { sectionId: "7C", hours: 5 },
        ],
        25
      )
    ).toEqual([["7A", "7B", "7C"]])
  })

  it("starts a new group, in section order, once the cap would be exceeded", () => {
    expect(
      bucketSections(
        [
          { sectionId: "7A", hours: 10 },
          { sectionId: "7B", hours: 10 },
          { sectionId: "7C", hours: 10 },
        ],
        25
      )
    ).toEqual([["7A", "7B"], ["7C"]])
  })

  it("gives a section heavier than the cap its own group", () => {
    expect(
      bucketSections(
        [
          { sectionId: "7A", hours: 30 },
          { sectionId: "7B", hours: 2 },
        ],
        25
      )
    ).toEqual([["7A"], ["7B"]])
  })
})

describe("buildTeacherPlan", () => {
  it("adds one placeholder per (grade, subject), shared by that grade's sections", () => {
    const plan = buildTeacherPlan({
      sections: [
        section("7A", "g7", [
          ["math", 5],
          ["arabic", 5],
        ]),
        section("7B", "g7", [
          ["math", 5],
          ["arabic", 5],
        ]),
        section("8A", "g8", [["math", 5]]),
      ],
      teachers: [],
      cap: CAP,
    })

    expect(plan.placeholderCount).toBe(3) // g7·math, g7·arabic, g8·math
    const mathA = plan.sections[0].subjects[0].preferredTeacherIds
    const mathB = plan.sections[1].subjects[0].preferredTeacherIds
    const math8 = plan.sections[2].subjects[0].preferredTeacherIds
    expect(mathA).toEqual(mathB)
    expect(mathA).not.toEqual(math8)
    expect(mathA.every((id) => id.startsWith(PLACEHOLDER_TEACHER_PREFIX))).toBe(
      true
    )
    const placeholder = plan.teachers.find((t) => t.teacherId === mathA[0])
    expect(placeholder?.subjectExpertise).toEqual(["math"])
    expect(placeholder?.maxPeriodsPerWeek).toBe(CAP.perWeek)
  })

  it("lists real qualified teachers before the placeholder", () => {
    const plan = buildTeacherPlan({
      sections: [section("7A", "g7", [["math", 5, ["t-real"]]])],
      teachers: [realTeacher("t-real", ["math"])],
      cap: CAP,
    })

    const ids = plan.sections[0].subjects[0].preferredTeacherIds
    expect(ids[0]).toBe("t-real")
    expect(isPlaceholderTeacherId(ids[1])).toBe(true)
    expect(plan.teachers.map((t) => t.teacherId)).toContain("t-real")
  })

  it("splits a grade's subject across placeholders when one teacher could not carry it", () => {
    const plan = buildTeacherPlan({
      sections: ["A", "B", "C", "D", "E", "F"].map((l) =>
        section(`7${l}`, "g7", [["arabic", 6]])
      ),
      teachers: [],
      cap: CAP,
    })

    const groups = new Set(
      plan.sections.map((s) => s.subjects[0].preferredTeacherIds[0])
    )
    expect(groups.size).toBe(2) // 36 periods > 25 → two placeholders
  })

  it("is deterministic for the same input", () => {
    const input = {
      sections: [section("7A", "g7", [["math", 5]])],
      teachers: [],
      cap: CAP,
    }
    expect(buildTeacherPlan(input)).toEqual(buildTeacherPlan(input))
  })
})

describe("stripPlaceholderTeachers", () => {
  const base: GeneratedSlot = {
    dayOfWeek: 0,
    periodId: "p1",
    sectionId: "7A",
    subjectId: "math",
    classId: "",
    teacherId: null,
    classroomId: "room",
    score: 50,
    violations: [],
  }

  it("turns placeholders into unassigned slots and flags them once", () => {
    const [placeholder, real, alreadyFlagged] = stripPlaceholderTeachers([
      { ...base, teacherId: `${PLACEHOLDER_TEACHER_PREFIX}g7:math:0` },
      { ...base, teacherId: "t-real" },
      {
        ...base,
        teacherId: `${PLACEHOLDER_TEACHER_PREFIX}g7:math:0`,
        violations: ["unassigned_teacher"],
      },
    ])

    expect(placeholder.teacherId).toBeNull()
    expect(placeholder.violations).toEqual(["unassigned_teacher"])
    expect(real.teacherId).toBe("t-real")
    expect(alreadyFlagged.violations).toEqual(["unassigned_teacher"])
  })
})
