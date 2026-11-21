// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  canManageMakeup,
  ownsMakeupClass,
} from "@/components/school-dashboard/live/makeup-rules"

const teacher = { role: "TEACHER", userId: "u-1" }
const makeup = { makeupForId: "missed-1", status: "scheduled", teacherUserId: "u-1" }

describe("ownsMakeupClass", () => {
  it("is the class's own teacher, or an admin", () => {
    expect(ownsMakeupClass(teacher, "u-1")).toBe(true)
    expect(ownsMakeupClass(teacher, "u-2")).toBe(false)
    expect(ownsMakeupClass({ role: "ADMIN", userId: "a" }, "u-2")).toBe(true)
    expect(ownsMakeupClass({ role: "DEVELOPER", userId: "d" }, null)).toBe(true)
  })

  it("is nobody else — a student, a guardian, a signed-out viewer", () => {
    expect(ownsMakeupClass({ role: "STUDENT", userId: "u-1" }, "u-1")).toBe(false)
    expect(ownsMakeupClass({ role: "GUARDIAN", userId: "g" }, "u-1")).toBe(false)
    expect(ownsMakeupClass({ role: null, userId: null }, null)).toBe(false)
    // A teacher with no id never matches a class with no teacher.
    expect(ownsMakeupClass({ role: "TEACHER", userId: undefined }, undefined)).toBe(false)
  })
})

describe("canManageMakeup", () => {
  it("offers re-plan and cancel to the owner of a make-up that has not started", () => {
    expect(canManageMakeup(teacher, makeup)).toBe(true)
    expect(canManageMakeup({ role: "ADMIN", userId: "a" }, makeup)).toBe(true)
  })

  it("offers nothing on a class that is not a make-up, or has started, ended or been cancelled", () => {
    expect(canManageMakeup(teacher, { ...makeup, makeupForId: null })).toBe(false)
    for (const status of ["live", "ended", "cancelled"])
      expect(canManageMakeup(teacher, { ...makeup, status })).toBe(false)
  })

  it("offers nothing to another teacher or a student", () => {
    expect(canManageMakeup({ role: "TEACHER", userId: "u-2" }, makeup)).toBe(false)
    expect(canManageMakeup({ role: "STUDENT", userId: "u-1" }, makeup)).toBe(false)
  })
})
