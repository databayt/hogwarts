import { describe, expect, it } from "vitest"

import {
  getStudentsSchema,
  studentCreateSchema,
  studentUpdateSchema,
} from "../validation"

describe("Student Validation Schemas", () => {
  describe("studentCreateSchema", () => {
    it("validates valid student data", () => {
      const validData = {
        givenName: "John",
        surname: "Doe",
        dateOfBirth: "2010-05-15",
        gender: "male",
        enrollmentDate: "2024-09-01",
      }

      const result = studentCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("accepts optional fields", () => {
      const minimalData = {}

      const result = studentCreateSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it("validates gender enum", () => {
      const validMale = { gender: "male" }
      const validFemale = { gender: "female" }
      const invalidGender = { gender: "other" }

      expect(studentCreateSchema.safeParse(validMale).success).toBe(true)
      expect(studentCreateSchema.safeParse(validFemale).success).toBe(true)
      expect(studentCreateSchema.safeParse(invalidGender).success).toBe(false)
    })
  })

  describe("studentUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        givenName: "John",
      }

      const result = studentUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("validates with id present", () => {
      const validUpdate = {
        id: "student-123",
        givenName: "John Updated",
      }

      const result = studentUpdateSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it("rejects empty id", () => {
      const emptyId = {
        id: "",
        givenName: "John",
      }

      const result = studentUpdateSchema.safeParse(emptyId)
      expect(result.success).toBe(false)
    })
  })

  describe("getStudentsSchema", () => {
    it("applies defaults for missing values", () => {
      const result = getStudentsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
      expect(result.name).toBe("")
      expect(result.className).toBe("")
      expect(result.status).toBe("")
      expect(result.sort).toEqual([])
    })

    it("validates page must be positive integer", () => {
      const negativePage = { page: -1 }
      const zeroPage = { page: 0 }
      const validPage = { page: 5 }

      expect(getStudentsSchema.safeParse(negativePage).success).toBe(false)
      expect(getStudentsSchema.safeParse(zeroPage).success).toBe(false)
      expect(getStudentsSchema.safeParse(validPage).success).toBe(true)
    })

    it("validates perPage max limit", () => {
      const tooMany = { perPage: 201 }
      const maxValid = { perPage: 200 }

      expect(getStudentsSchema.safeParse(tooMany).success).toBe(false)
      expect(getStudentsSchema.safeParse(maxValid).success).toBe(true)
    })

    it("validates sort array structure", () => {
      const validSort = {
        sort: [
          { id: "givenName", desc: true },
          { id: "surname", desc: false },
        ],
      }

      const invalidSort = {
        sort: [{ wrongField: "value" }],
      }

      expect(getStudentsSchema.safeParse(validSort).success).toBe(true)
      expect(getStudentsSchema.safeParse(invalidSort).success).toBe(false)
    })
  })
})
