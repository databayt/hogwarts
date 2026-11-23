// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  coverState,
  isSupervisorRole,
  mayCoverSession,
  noTeacherRecipients,
} from "@/components/school-dashboard/live/supervisors"

describe("mayCoverSession", () => {
  it("lets an admin cover any class, even one of unknown stage", () => {
    expect(mayCoverSession({ role: "ADMIN", stage: "primary", supervisedStages: [] })).toBe(true)
    expect(mayCoverSession({ role: "ADMIN", stage: null, supervisedStages: [] })).toBe(true)
    expect(mayCoverSession({ role: "DEVELOPER", stage: "kg", supervisedStages: [] })).toBe(true)
  })

  it("lets a supervisor cover only the stages they hold", () => {
    const base = { role: "STAFF", supervisedStages: ["primary"] }
    expect(mayCoverSession({ ...base, stage: "primary" })).toBe(true)
    expect(mayCoverSession({ ...base, stage: "secondary" })).toBe(false)
    expect(mayCoverSession({ ...base, stage: null })).toBe(false)
  })

  it("refuses everyone else", () => {
    for (const role of ["STUDENT", "GUARDIAN", "ACCOUNTANT", "TEACHER", null]) {
      expect(mayCoverSession({ role, stage: "primary", supervisedStages: [] })).toBe(false)
    }
  })
})

describe("coverState", () => {
  const now = new Date("2026-11-22T09:10:00Z")
  const end = new Date("2026-11-22T09:45:00Z")
  const base = { status: "scheduled", coveredByUserId: null, userId: "me", scheduledEnd: end, now }

  it("is ok for an uncovered class still in its time", () => {
    expect(coverState(base)).toBe("ok")
    expect(coverState({ ...base, status: "live" })).toBe("ok")
  })
  it("never overwrites another cover; a second tap by the same person walks back in", () => {
    expect(coverState({ ...base, coveredByUserId: "someone" })).toBe("taken")
    expect(coverState({ ...base, coveredByUserId: "me" })).toBe("mine")
  })
  it("is over once cancelled, ended or past its end", () => {
    expect(coverState({ ...base, status: "cancelled" })).toBe("over")
    expect(coverState({ ...base, status: "ended" })).toBe("over")
    expect(coverState({ ...base, now: end })).toBe("over")
  })
})

describe("recipients and roles", () => {
  it("admins first, then supervisors, each once", () => {
    expect(
      noTeacherRecipients({ adminUserIds: ["a1", "a2"], supervisorUserIds: ["s1", "a2"] })
    ).toEqual(["a1", "a2", "s1"])
  })
  it("only ADMIN, STAFF and TEACHER can be picked", () => {
    expect(isSupervisorRole("STAFF")).toBe(true)
    expect(isSupervisorRole("STUDENT")).toBe(false)
    expect(isSupervisorRole(undefined)).toBe(false)
  })
})

describe("the class's own supervisor (homeroom teacher)", () => {
  it("is alerted along with the admins, once, and never the absent teacher", () => {
    expect(
      noTeacherRecipients({
        adminUserIds: ["admin"],
        supervisorUserIds: ["stage-sup", "homeroom"],
        classSupervisorUserIds: ["homeroom", null],
        absentTeacherUserId: "stage-sup",
      })
    ).toEqual(["admin", "homeroom"])
  })

  it("does not alert the class supervisor about her own missed class", () => {
    expect(
      noTeacherRecipients({
        adminUserIds: ["admin"],
        supervisorUserIds: [],
        classSupervisorUserIds: ["afrah"],
        absentTeacherUserId: "afrah",
      })
    ).toEqual(["admin"])
  })

  it("may cover her class with no stage assignment", () => {
    expect(
      mayCoverSession({ role: "TEACHER", stage: "kg", supervisedStages: [], isClassSupervisor: true })
    ).toBe(true)
    expect(mayCoverSession({ role: "TEACHER", stage: "kg", supervisedStages: [] })).toBe(false)
  })
})
