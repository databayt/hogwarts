// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import type { Period, TimetableSlot } from "../types"
import {
  calculatePeriodDuration,
  calculateTeacherWorkload,
  calculateUtilizationRate,
  detectConflicts,
  exportToCSV,
  findAvailableSlots,
  formatPeriodTime,
  formatTime,
  getDayName,
  getSubjectColor,
  groupSlotsByDay,
  parseCSVImport,
  sortSlotsByPeriod,
  validateSlotPlacement,
} from "../utils"

function mkSlot(over: Partial<TimetableSlot> = {}): TimetableSlot {
  return {
    id: "s1",
    schoolId: "sch",
    termId: "t1",
    dayOfWeek: 0,
    periodId: "p1",
    classId: "c1",
    weekOffset: 0,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...over,
  }
}

function mkPeriod(over: Partial<Period> = {}): Period {
  return {
    id: "p1",
    name: "Period 1",
    startTime: "08:00",
    endTime: "09:00",
    order: 1,
    ...over,
  }
}

describe("formatting helpers", () => {
  it("formatTime renders 12-hour AM/PM", () => {
    expect(formatTime("08:30")).toBe("8:30 AM")
    expect(formatTime("13:15")).toBe("1:15 PM")
    expect(formatTime("00:00")).toBe("12:00 AM")
    expect(formatTime("12:00")).toBe("12:00 PM")
    expect(formatTime("")).toBe("")
  })

  it("formatPeriodTime joins start and end", () => {
    expect(formatPeriodTime("08:00", "09:00")).toBe("8:00 AM - 9:00 AM")
  })

  it("getDayName returns long and short names", () => {
    expect(getDayName(0)).toBe("Sunday")
    expect(getDayName(4)).toBe("Thursday")
    expect(getDayName(1, true)).toBe("Mon")
  })

  it("getSubjectColor falls back to a default", () => {
    expect(getSubjectColor("totally-unknown-subject")).toBe(
      getSubjectColor("default")
    )
  })
})

describe("calculatePeriodDuration", () => {
  it("computes hour fractions", () => {
    expect(calculatePeriodDuration("08:00", "09:00")).toBe(1)
    expect(calculatePeriodDuration("08:00", "08:30")).toBe(0.5)
    expect(calculatePeriodDuration("08:00", "10:30")).toBe(2.5)
  })
})

describe("detectConflicts", () => {
  it("flags a teacher double-booking", () => {
    const slots = [
      mkSlot({ id: "a", classId: "c1", teacherId: "T1" }),
      mkSlot({ id: "b", classId: "c2", teacherId: "T1" }),
    ]
    const conflicts = detectConflicts(slots)
    expect(conflicts.some((c) => c.type === "teacher")).toBe(true)
  })

  it("flags a classroom double-booking", () => {
    const slots = [
      mkSlot({ id: "a", classId: "c1", classroomId: "R1" }),
      mkSlot({ id: "b", classId: "c2", classroomId: "R1" }),
    ]
    expect(detectConflicts(slots).some((c) => c.type === "classroom")).toBe(
      true
    )
  })

  it("flags the same class scheduled twice", () => {
    const slots = [
      mkSlot({ id: "a", classId: "c1" }),
      mkSlot({ id: "b", classId: "c1" }),
    ]
    expect(detectConflicts(slots).some((c) => c.type === "class")).toBe(true)
  })

  it("returns no conflicts across different periods", () => {
    const slots = [
      mkSlot({ id: "a", periodId: "p1", teacherId: "T1" }),
      mkSlot({ id: "b", periodId: "p2", teacherId: "T1", classId: "c2" }),
    ]
    expect(detectConflicts(slots)).toHaveLength(0)
  })
})

describe("validateSlotPlacement", () => {
  it("is valid when no conflict arises", () => {
    const existing = [mkSlot({ id: "a", periodId: "p1", classId: "c1" })]
    const next = mkSlot({ id: "b", periodId: "p2", classId: "c2" })
    expect(validateSlotPlacement(next, existing).valid).toBe(true)
  })

  it("is invalid and reports a message when it collides", () => {
    const existing = [mkSlot({ id: "a", teacherId: "T1", classId: "c1" })]
    const next = mkSlot({ id: "b", teacherId: "T1", classId: "c2" })
    const result = validateSlotPlacement(next, existing)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe("workload + availability", () => {
  it("calculateTeacherWorkload sums per-day and weekly hours", () => {
    const periods = [
      mkPeriod({ id: "p1", startTime: "08:00", endTime: "09:00" }),
      mkPeriod({ id: "p2", startTime: "09:00", endTime: "10:00" }),
    ]
    const slots = [
      mkSlot({ id: "a", dayOfWeek: 0, periodId: "p1", teacherId: "T1" }),
      mkSlot({ id: "b", dayOfWeek: 0, periodId: "p2", teacherId: "T1" }),
    ]
    const result = calculateTeacherWorkload("T1", slots, periods)
    expect(result.hoursPerWeek).toBe(2)
    expect(result.hoursPerDay[0]).toBe(2)
    expect(result.violations).toEqual([])
  })

  it("findAvailableSlots skips occupied and break periods", () => {
    const periods = [
      mkPeriod({ id: "p1" }),
      mkPeriod({ id: "p2" }),
      mkPeriod({ id: "p3", isBreak: true }),
    ]
    const slots = [
      mkSlot({ id: "a", dayOfWeek: 0, periodId: "p1", teacherId: "T1" }),
    ]
    const available = findAvailableSlots("T1", slots, periods, [0])
    // p1 occupied, p3 is a break → only p2 is free
    expect(available).toEqual([{ day: 0, periodId: "p2" }])
  })
})

describe("grouping + utilization", () => {
  it("groupSlotsByDay buckets slots by day", () => {
    const grouped = groupSlotsByDay([
      mkSlot({ id: "a", dayOfWeek: 0 }),
      mkSlot({ id: "b", dayOfWeek: 0 }),
      mkSlot({ id: "c", dayOfWeek: 1 }),
    ])
    expect(grouped[0]).toHaveLength(2)
    expect(grouped[1]).toHaveLength(1)
  })

  it("sortSlotsByPeriod orders by period index", () => {
    const periods = [mkPeriod({ id: "p1" }), mkPeriod({ id: "p2" })]
    const sorted = sortSlotsByPeriod(
      [
        mkSlot({ id: "b", periodId: "p2" }),
        mkSlot({ id: "a", periodId: "p1" }),
      ],
      periods
    )
    expect(sorted.map((s) => s.id)).toEqual(["a", "b"])
  })

  it("calculateUtilizationRate handles ratio and zero divisor", () => {
    expect(calculateUtilizationRate([mkSlot(), mkSlot(), mkSlot()], 10)).toBe(
      30
    )
    expect(calculateUtilizationRate([], 0)).toBe(0)
  })
})

describe("CSV export/import", () => {
  it("exportToCSV emits a header and one row per period", () => {
    const periods = [
      mkPeriod({ id: "p1", startTime: "08:00", endTime: "09:00" }),
    ]
    const slots = [mkSlot({ dayOfWeek: 0, periodId: "p1", subjectId: "Math" })]
    const csv = exportToCSV(slots, periods, [0])
    const lines = csv.split("\n")
    expect(lines[0]).toBe("Time,Sunday")
    expect(lines[1]).toContain("Math")
  })

  it("parseCSVImport round-trips a valid sheet", () => {
    const result = parseCSVImport("day,period\n1,p1")
    expect(result.valid).toBe(true)
    expect(result.data).toEqual([{ day: "1", period: "p1" }])
  })

  it("parseCSVImport rejects an empty file", () => {
    expect(parseCSVImport("").valid).toBe(false)
  })

  it("parseCSVImport rejects a row with the wrong column count", () => {
    const result = parseCSVImport("day,period\n1")
    expect(result.valid).toBe(false)
    expect(result.errors?.length).toBeGreaterThan(0)
  })
})
