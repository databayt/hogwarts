// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  getSubjectsSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
} from "../validation"

describe("Subject Validation Schemas", () => {
  describe("subjectCreateSchema", () => {
    it("accepts valid input with subjectName and departmentId", () => {
      const result = subjectCreateSchema.safeParse({
        subjectName: "Mathematics",
        departmentId: "dept-123",
      })
      expect(result.success).toBe(true)
    })

    it("rejects missing subjectName", () => {
      const result = subjectCreateSchema.safeParse({
        departmentId: "dept-123",
      })
      expect(result.success).toBe(false)
    })

    it("rejects empty subjectName", () => {
      const result = subjectCreateSchema.safeParse({
        subjectName: "",
        departmentId: "dept-123",
      })
      expect(result.success).toBe(false)
    })

    it("rejects missing departmentId", () => {
      const result = subjectCreateSchema.safeParse({
        subjectName: "Mathematics",
      })
      expect(result.success).toBe(false)
    })

    it("rejects empty departmentId", () => {
      const result = subjectCreateSchema.safeParse({
        subjectName: "Mathematics",
        departmentId: "",
      })
      expect(result.success).toBe(false)
    })

    it("accepts optional catalogSubjectId", () => {
      const result = subjectCreateSchema.safeParse({
        subjectName: "Mathematics",
        departmentId: "dept-123",
        catalogSubjectId: "catalog-1",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.catalogSubjectId).toBe("catalog-1")
      }
    })

    it("accepts optional lang", () => {
      const result = subjectCreateSchema.safeParse({
        subjectName: "Mathematics",
        departmentId: "dept-123",
        lang: "en",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.lang).toBe("en")
      }
    })
  })

  describe("subjectUpdateSchema", () => {
    it("requires id", () => {
      const result = subjectUpdateSchema.safeParse({
        subjectName: "Updated Math",
      })
      expect(result.success).toBe(false)
    })

    it("rejects empty id", () => {
      const result = subjectUpdateSchema.safeParse({
        id: "",
        subjectName: "Updated Math",
      })
      expect(result.success).toBe(false)
    })

    it("allows partial updates with just id", () => {
      const result = subjectUpdateSchema.safeParse({
        id: "subject-123",
      })
      expect(result.success).toBe(true)
    })

    it("allows updating subjectName only", () => {
      const result = subjectUpdateSchema.safeParse({
        id: "subject-123",
        subjectName: "Advanced Mathematics",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.subjectName).toBe("Advanced Mathematics")
      }
    })

    it("validates subjectName when provided", () => {
      const result = subjectUpdateSchema.safeParse({
        id: "subject-123",
        subjectName: "",
      })
      // subjectName is .partial() so empty string should be allowed through .partial()
      // but min(1) on the base schema means it fails
      expect(result.success).toBe(false)
    })
  })

  describe("getSubjectsSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getSubjectsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
      expect(result.subjectName).toBe("")
      expect(result.departmentId).toBe("")
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
        subjectName: "math",
        departmentId: "dept-123",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.subjectName).toBe("math")
        expect(result.data.departmentId).toBe("dept-123")
      }
    })

    it("accepts sort array", () => {
      const result = getSubjectsSchema.safeParse({
        sort: [{ id: "subjectName", desc: false }],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sort).toEqual([{ id: "subjectName", desc: false }])
      }
    })
  })
})
