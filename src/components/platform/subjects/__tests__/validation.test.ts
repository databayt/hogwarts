import { describe, it, expect } from "vitest"
import { z } from "zod"

// Subject validation schema tests
describe("Subject Validation Schemas", () => {
  const subjectBaseSchema = z.object({
    name: z.string().min(1, "Subject name is required"),
    code: z.string().min(1, "Subject code is required"),
    description: z.string().optional(),
    credits: z.number().min(0).max(20).optional(),
    departmentId: z.string().optional(),
    isActive: z.boolean().default(true),
  })

  const subjectCreateSchema = subjectBaseSchema

  const subjectUpdateSchema = subjectBaseSchema.partial().extend({
    id: z.string().min(1, "ID is required"),
  })

  const getSubjectsSchema = z.object({
    page: z.number().int().positive().default(1),
    perPage: z.number().int().positive().max(100).default(20),
    search: z.string().optional().default(""),
    departmentId: z.string().optional(),
    isActive: z.boolean().optional(),
  })

  describe("subjectCreateSchema", () => {
    it("validates complete subject data", () => {
      const validData = {
        name: "Mathematics",
        code: "MATH101",
        description: "Introduction to Mathematics",
        credits: 3,
        departmentId: "dept-123",
        isActive: true,
      }

      const result = subjectCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires name and code", () => {
      const missingName = {
        code: "MATH101",
      }

      const missingCode = {
        name: "Mathematics",
      }

      expect(subjectCreateSchema.safeParse(missingName).success).toBe(false)
      expect(subjectCreateSchema.safeParse(missingCode).success).toBe(false)
    })

    it("validates credits range", () => {
      const validCredits = {
        name: "Math",
        code: "M1",
        credits: 4,
      }

      const invalidCredits = {
        name: "Math",
        code: "M1",
        credits: 25, // Over max
      }

      const negativeCredits = {
        name: "Math",
        code: "M1",
        credits: -1,
      }

      expect(subjectCreateSchema.safeParse(validCredits).success).toBe(true)
      expect(subjectCreateSchema.safeParse(invalidCredits).success).toBe(false)
      expect(subjectCreateSchema.safeParse(negativeCredits).success).toBe(false)
    })

    it("applies default for isActive", () => {
      const withoutActive = {
        name: "Science",
        code: "SCI101",
      }

      const result = subjectCreateSchema.parse(withoutActive)
      expect(result.isActive).toBe(true)
    })
  })

  describe("subjectUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        name: "Updated Subject",
      }

      const result = subjectUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "subject-123",
        description: "Updated description",
      }

      const result = subjectUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it("validates credits on update", () => {
      const validUpdate = {
        id: "subject-123",
        credits: 5,
      }

      const invalidUpdate = {
        id: "subject-123",
        credits: 100,
      }

      expect(subjectUpdateSchema.safeParse(validUpdate).success).toBe(true)
      expect(subjectUpdateSchema.safeParse(invalidUpdate).success).toBe(false)
    })
  })

  describe("getSubjectsSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getSubjectsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
      expect(result.search).toBe("")
    })

    it("validates pagination limits", () => {
      const tooMany = { perPage: 101 }
      const valid = { perPage: 50 }

      expect(getSubjectsSchema.safeParse(tooMany).success).toBe(false)
      expect(getSubjectsSchema.safeParse(valid).success).toBe(true)
    })

    it("accepts filter parameters", () => {
      const withFilters = {
        departmentId: "dept-123",
        isActive: true,
        search: "math",
      }

      const result = getSubjectsSchema.safeParse(withFilters)
      expect(result.success).toBe(true)
    })
  })
})
