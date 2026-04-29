// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { bulkUpdateSubjectRoomsSchema } from "../validation"

describe("bulkUpdateSubjectRoomsSchema", () => {
  it("accepts at least one assignment", () => {
    const result = bulkUpdateSubjectRoomsSchema.safeParse({
      assignments: [{ classId: "c1", classroomId: "r1" }],
    })
    expect(result.success).toBe(true)
  })

  it("rejects an empty assignments array", () => {
    expect(
      bulkUpdateSubjectRoomsSchema.safeParse({ assignments: [] }).success
    ).toBe(false)
  })

  it("rejects assignments with empty ids", () => {
    expect(
      bulkUpdateSubjectRoomsSchema.safeParse({
        assignments: [{ classId: "", classroomId: "r1" }],
      }).success
    ).toBe(false)
    expect(
      bulkUpdateSubjectRoomsSchema.safeParse({
        assignments: [{ classId: "c1", classroomId: "" }],
      }).success
    ).toBe(false)
  })

  it("rejects when assignments is missing", () => {
    expect(bulkUpdateSubjectRoomsSchema.safeParse({}).success).toBe(false)
  })
})
