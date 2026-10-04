// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  planAssignment,
  type PlanSlot,
  type PlanState,
  type SlotPatch,
  type TeacherRules,
} from "@/components/school-dashboard/timetable/assignments/plan"

const DAYS = [0, 1, 2, 3, 4]
const PERIODS = ["p1", "p2", "p3", "p4", "p5"]
const DEFAULT_RULES: TeacherRules = {
  maxPerDay: 6,
  maxPerWeek: 25,
  unavailable: new Set(),
}

/**
 * A section's week from a compact grid: one string per day, one letter per
 * period (M = math, A = arabic, E = english, S = science, . = empty).
 */
function week(
  sectionId: string,
  rows: string[],
  opts: { teachers?: Record<string, string>; room?: string } = {}
): PlanSlot[] {
  const subjects: Record<string, string> = {
    M: "math",
    A: "arabic",
    E: "english",
    S: "science",
    L: "lab",
  }
  const slots: PlanSlot[] = []
  rows.forEach((row, day) => {
    ;[...row].forEach((ch, i) => {
      if (ch === ".") return
      const subjectId = subjects[ch]
      slots.push({
        id: `${sectionId}-${day}-${PERIODS[i]}`,
        dayOfWeek: day,
        periodId: PERIODS[i],
        sectionId,
        subjectId,
        teacherId: opts.teachers?.[subjectId] ?? null,
        classroomId: opts.room ?? `room-${sectionId}`,
        fixed: false,
      })
    })
  })
  return slots
}

function state(
  slots: PlanSlot[],
  rules: Record<string, Partial<TeacherRules>> = {}
): PlanState {
  return {
    slots,
    workingDays: DAYS,
    periodOrder: PERIODS,
    rules: new Map(
      Object.entries(rules).map(([id, r]) => [id, { ...DEFAULT_RULES, ...r }])
    ),
    defaultRules: DEFAULT_RULES,
  }
}

function apply(slots: PlanSlot[], patches: SlotPatch[]): PlanSlot[] {
  const byId = new Map(patches.map((p) => [p.id, p]))
  return slots.map((s) => {
    const p = byId.get(s.id)
    return p ? { ...s, ...p } : s
  })
}

function doubleBooked(slots: PlanSlot[], key: "teacherId" | "classroomId") {
  const seen = new Set<string>()
  for (const s of slots) {
    const owner = s[key]
    if (!owner) continue
    const k = `${owner}|${s.dayOfWeek}|${s.periodId}`
    if (seen.has(k)) return true
    seen.add(k)
  }
  return false
}

const MIRRORED = ["MAESE", "MAESE", "MAESE", "MAES.", "MAE.."]

describe("planAssignment", () => {
  it("assigns every period directly when the teacher is free", () => {
    const slots = week("7A", MIRRORED)
    const plan = planAssignment(state(slots), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A"],
    })

    expect(plan.assigned).toHaveLength(5)
    expect(plan.moved).toEqual([])
    expect(plan.residual).toEqual([])
    expect(plan.patches.every((p) => p.teacherId === "t1")).toBe(true)
  })

  it("repairs mirrored parallel sections so one teacher takes both", () => {
    const slots = [...week("7A", MIRRORED), ...week("7B", MIRRORED)]
    const plan = planAssignment(state(slots), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A", "7B"],
    })

    expect(plan.residual).toEqual([])
    expect(plan.assigned).toHaveLength(10)
    const after = apply(slots, plan.patches)
    expect(doubleBooked(after, "teacherId")).toBe(false)
    expect(doubleBooked(after, "classroomId")).toBe(false)
    // 7A is untouched: the direct pass took it as it was.
    expect(plan.moved.every((id) => id.startsWith("7B"))).toBe(true)
    // Math still appears once a day in 7B.
    const mathDays = after
      .filter((s) => s.sectionId === "7B" && s.subjectId === "math")
      .map((s) => s.dayOfWeek)
    expect(new Set(mathDays).size).toBe(mathDays.length)
  })

  it("never swaps into a time where the other lesson's teacher is busy", () => {
    // 7B's arabic teacher also teaches 7C arabic at p1 every day, so moving
    // 7B arabic to p1 (math's time) would double-book them.
    const slots = [
      ...week("7A", ["M....", "M....", "M....", "M....", "M...."]),
      ...week("7B", ["MA...", "MA...", "MA...", "MA...", "MA..."], {
        teachers: { arabic: "t-ar" },
      }),
      ...week("7C", ["A....", "A....", "A....", "A....", "A...."], {
        teachers: { arabic: "t-ar" },
      }),
    ]
    const plan = planAssignment(state(slots), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A", "7B"],
    })

    const after = apply(slots, plan.patches)
    expect(doubleBooked(after, "teacherId")).toBe(false)
    expect(plan.residual).toEqual([])
    // 7B's math went to an empty period, not onto arabic's time.
    expect(
      after
        .filter((s) => s.sectionId === "7B" && s.subjectId === "arabic")
        .every((s) => s.periodId === "p2")
    ).toBe(true)
  })

  it("keeps a lab lesson out of a period where its lab is taken", () => {
    const slots = [
      ...week("7A", ["M....", ".....", ".....", ".....", "....."]),
      // 7B: math clashes with 7A at day0 p1; its only swap partner is a lab
      // lesson in the shared lab at p2, and the lab is busy at p1 (8A uses it).
      ...week("7B", ["ML...", ".....", ".....", ".....", "....."]).map((s) =>
        s.subjectId === "lab" ? { ...s, classroomId: "lab-1" } : s
      ),
      {
        ...week("8A", ["L....", ".....", ".....", ".....", "....."])[0],
        classroomId: "lab-1",
      },
    ]
    const plan = planAssignment(state(slots), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A", "7B"],
    })

    const after = apply(slots, plan.patches)
    expect(doubleBooked(after, "classroomId")).toBe(false)
    // The lab lesson stayed put; math moved to an empty period instead.
    expect(
      after.find((s) => s.subjectId === "lab" && s.sectionId === "7B")?.periodId
    ).toBe("p2")
    expect(plan.residual).toEqual([])
  })

  it("never moves a fixed cell, and reports a fixed clash it can't fix", () => {
    const slots = [
      ...week("7A", ["M....", ".....", ".....", ".....", "....."]),
      ...week("7B", ["M....", ".....", ".....", ".....", "....."]).map((s) => ({
        ...s,
        fixed: true,
      })),
    ]
    const plan = planAssignment(state(slots), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A", "7B"],
    })

    expect(plan.residual).toEqual([
      { slotId: "7B-0-p1", reason: "FIXED_SESSION" },
    ])
    expect(plan.patches.find((p) => p.id === "7B-0-p1")).toBeUndefined()
  })

  it("works around the teacher's unavailable periods", () => {
    const slots = week("7A", ["MA...", ".....", ".....", ".....", "....."])
    const plan = planAssignment(
      state(slots, { t1: { unavailable: new Set(["0:p1"]) } }),
      { teacherId: "t1", subjectId: "math", sectionIds: ["7A"] }
    )

    expect(plan.residual).toEqual([])
    const after = apply(slots, plan.patches)
    const math = after.find((s) => s.subjectId === "math")!
    expect(`${math.dayOfWeek}:${math.periodId}`).not.toBe("0:p1")
    expect(math.teacherId).toBe("t1")
  })

  it("moves a period to another day when the daily cap is reached", () => {
    // t1 already teaches 7C twice on day 0; cap 2 per day.
    const slots = [
      ...week("7C", ["MM...", ".....", ".....", ".....", "....."], {
        teachers: { math: "t1" },
      }),
      ...week("7A", ["..M..", ".....", ".....", ".....", "....."]),
    ]
    const plan = planAssignment(state(slots, { t1: { maxPerDay: 2 } }), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A"],
    })

    expect(plan.residual).toEqual([])
    const after = apply(slots, plan.patches)
    const moved = after.find(
      (s) => s.sectionId === "7A" && s.subjectId === "math"
    )!
    expect(moved.dayOfWeek).not.toBe(0)
  })

  it("stops at the weekly cap and reports what is left", () => {
    const slots = week("7A", MIRRORED)
    const plan = planAssignment(state(slots, { t1: { maxPerWeek: 3 } }), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A"],
    })

    expect(plan.assigned).toHaveLength(3)
    expect(plan.residual.map((r) => r.reason)).toEqual([
      "WEEKLY_CAP",
      "WEEKLY_CAP",
    ])
  })

  it("takes the subject over from its previous teacher", () => {
    const slots = week("7A", MIRRORED, { teachers: { math: "t-old" } })
    const plan = planAssignment(state(slots), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A"],
    })

    expect(plan.released).toHaveLength(5)
    expect(plan.assigned).toHaveLength(5)
    const after = apply(slots, plan.patches)
    expect(after.some((s) => s.teacherId === "t-old")).toBe(false)
  })

  it("moves into an empty period of the section", () => {
    const slots = [
      ...week("7A", ["M....", ".....", ".....", ".....", "....."]),
      ...week("7B", ["M....", ".....", ".....", ".....", "....."]),
    ]
    const plan = planAssignment(state(slots), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A", "7B"],
    })

    expect(plan.residual).toEqual([])
    expect(plan.moved).toEqual(["7B-0-p1"])
    const patch = plan.patches.find((p) => p.id === "7B-0-p1")!
    expect(patch.teacherId).toBe("t1")
    expect(patch.periodId ?? "p1").not.toBe("p1")
  })

  it("gives the same plan for the same input", () => {
    const slots = [...week("7A", MIRRORED), ...week("7B", MIRRORED)]
    const req = { teacherId: "t1", subjectId: "math", sectionIds: ["7A", "7B"] }
    expect(planAssignment(state(slots), req)).toEqual(
      planAssignment(state(slots), req)
    )
  })

  it("changes nothing when run again on its own result", () => {
    const slots = [...week("7A", MIRRORED), ...week("7B", MIRRORED)]
    const req = { teacherId: "t1", subjectId: "math", sectionIds: ["7A", "7B"] }
    const first = planAssignment(state(slots), req)
    const second = planAssignment(state(apply(slots, first.patches)), req)
    expect(second.patches).toEqual([])
    expect(second.assigned).toHaveLength(10)
  })

  it("leaves sections outside the request untouched", () => {
    const slots = [
      ...week("7A", MIRRORED),
      ...week("7B", MIRRORED),
      ...week("8A", MIRRORED),
    ]
    const plan = planAssignment(state(slots), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A", "7B"],
    })
    expect(plan.patches.some((p) => p.id.startsWith("8A"))).toBe(false)
  })

  it("fits three mirrored sections with swaps", () => {
    const slots = ["7A", "7B", "7C"].flatMap((id) => week(id, MIRRORED))
    const plan = planAssignment(state(slots), {
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A", "7B", "7C"],
    })

    expect(plan.residual).toEqual([])
    expect(plan.assigned).toHaveLength(15)
    expect(doubleBooked(apply(slots, plan.patches), "teacherId")).toBe(false)
  })
})
