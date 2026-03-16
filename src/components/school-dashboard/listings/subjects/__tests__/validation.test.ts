// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  getSubjectsSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
} from "../validation"

describe("Subject Validation Schemas", () => {
  describe("subjectCreateSchema (subjectSelectSchema)", () => {
    it("accepts valid input with catalogSubjectId and gradeId", () => {
      const result = subjectCreateSchema.safeParse({
        catalogSubjectId: "catalog-123",
        gradeId: "grade-1",
      })
      expect(result.success).toBe(true)
    })

    it("rejects missing catalogSubjectId", () => {
      const result = subjectCreateSchema.safeParse({
        gradeId: "grade-1",
      })
      expect(result.success).toBe(false)
    })

    it("rejects empty catalogSubjectId", () => {
      const result = subjectCreateSchema.safeParse({
        catalogSubjectId: "",
        gradeId: "grade-1",
      })
      expect(result.success).toBe(false)
    })

    it("rejects missing gradeId", () => {
      const result = subjectCreateSchema.safeParse({
        catalogSubjectId: "catalog-123",
      })
      expect(result.success).toBe(false)
    })

    it("rejects empty gradeId", () => {
      const result = subjectCreateSchema.safeParse({
        catalogSubjectId: "catalog-123",
        gradeId: "",
      })
      expect(result.success).toBe(false)
    })

    it("accepts optional weeklyPeriods", () => {
      const result = subjectCreateSchema.safeParse({
        catalogSubjectId: "catalog-123",
        gradeId: "grade-1",
        weeklyPeriods: 5,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.weeklyPeriods).toBe(5)
      }
    })

    it("accepts optional customName", () => {
      const result = subjectCreateSchema.safeParse({
        catalogSubjectId: "catalog-123",
        gradeId: "grade-1",
        customName: "Advanced Mathematics",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.customName).toBe("Advanced Mathematics")
      }
    })
  })

  describe("subjectUpdateSchema", () => {
    it("requires id", () => {
      const result = subjectUpdateSchema.safeParse({
        customName: "Updated Name",
      })
      expect(result.success).toBe(false)
    })

    it("rejects empty id", () => {
      const result = subjectUpdateSchema.safeParse({
        id: "",
        customName: "Updated Name",
      })
      expect(result.success).toBe(false)
    })

    it("allows partial updates with just id", () => {
      const result = subjectUpdateSchema.safeParse({
        id: "selection-123",
      })
      expect(result.success).toBe(true)
    })

    it("allows updating isActive", () => {
      const result = subjectUpdateSchema.safeParse({
        id: "selection-123",
        isActive: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isActive).toBe(false)
      }
    })
  })

  describe("getSubjectsSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getSubjectsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
      expect(result.name).toBe("")
      expect(result.department).toBe("")
      expect(result.sort).toEqual([])
    })

    it("validates perPage max (200)", () => {
      const tooMany = getSubjectsSchema.safeParse({ perPage: 201 })
      const atMax = getSubjectsSchema.safeParse({ perPage: 200 })

      expect(tooMany.success).toBe(false)
      expect(atMax.success).toBe(true)
    })

    it("validates page is positive integer", () => {
      const zero = getSubjectsSchema.safeParse({ page: 0 })
      const negative = getSubjectsSchema.safeParse({ page: -1 })
      const valid = getSubjectsSchema.safeParse({ page: 5 })

      expect(zero.success).toBe(false)
      expect(negative.success).toBe(false)
      expect(valid.success).toBe(true)
    })

    it("accepts filter parameters", () => {
      const result = getSubjectsSchema.safeParse({
        name: "math",
        department: "Sciences",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("math")
        expect(result.data.department).toBe("Sciences")
      }
    })

    it("accepts sort array", () => {
      const result = getSubjectsSchema.safeParse({
        sort: [{ id: "name", desc: false }],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sort).toEqual([{ id: "name", desc: false }])
      }
    })
  })
})
