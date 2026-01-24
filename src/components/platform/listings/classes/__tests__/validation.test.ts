import { describe, expect, it } from "vitest"

import {
  classCreateSchema,
  classUpdateSchema,
  getClassesSchema,
} from "../validation"

describe("Class Validation Schemas", () => {
  describe("classCreateSchema", () => {
    it("validates complete class data", () => {
      const validData = {
        name: "Mathematics 101",
        subjectId: "subject-123",
        teacherId: "teacher-123",
        termId: "term-123",
        startPeriodId: "period-1",
        endPeriodId: "period-2",
        classroomId: "classroom-123",
        evaluationType: "NORMAL",
      }

      const result = classCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires mandatory fields", () => {
      const missingFields = {
        name: "Math",
      }

      const result = classCreateSchema.safeParse(missingFields)
      expect(result.success).toBe(false)
    })

    it("validates evaluation type enum", () => {
      const validTypes = ["NORMAL", "GPA", "CWA", "CCE"]

      validTypes.forEach((type) => {
        const data = {
          name: "Test",
          subjectId: "s1",
          teacherId: "t1",
          termId: "term1",
          startPeriodId: "p1",
          endPeriodId: "p2",
          classroomId: "c1",
          evaluationType: type,
        }
        expect(classCreateSchema.safeParse(data).success).toBe(true)
      })

      const invalidType = {
        name: "Test",
        subjectId: "s1",
        teacherId: "t1",
        termId: "term1",
        startPeriodId: "p1",
        endPeriodId: "p2",
        classroomId: "c1",
        evaluationType: "INVALID",
      }
      expect(classCreateSchema.safeParse(invalidType).success).toBe(false)
    })

    it("validates capacity constraints", () => {
      const validCapacity = {
        name: "Class",
        subjectId: "s1",
        teacherId: "t1",
        termId: "term1",
        startPeriodId: "p1",
        endPeriodId: "p2",
        classroomId: "c1",
        evaluationType: "NORMAL",
        minCapacity: 10,
        maxCapacity: 30,
      }

      const invalidCapacity = {
        name: "Class",
        subjectId: "s1",
        teacherId: "t1",
        termId: "term1",
        startPeriodId: "p1",
        endPeriodId: "p2",
        classroomId: "c1",
        evaluationType: "NORMAL",
        minCapacity: 30,
        maxCapacity: 10, // Less than min - should fail
      }

      expect(classCreateSchema.safeParse(validCapacity).success).toBe(true)
      expect(classCreateSchema.safeParse(invalidCapacity).success).toBe(false)
    })

    it("validates credits range", () => {
      const validCredits = {
        name: "Class",
        subjectId: "s1",
        teacherId: "t1",
        termId: "term1",
        startPeriodId: "p1",
        endPeriodId: "p2",
        classroomId: "c1",
        evaluationType: "NORMAL",
        credits: 3.5,
      }

      const invalidCredits = {
        name: "Class",
        subjectId: "s1",
        teacherId: "t1",
        termId: "term1",
        startPeriodId: "p1",
        endPeriodId: "p2",
        classroomId: "c1",
        evaluationType: "NORMAL",
        credits: 1000, // Over max
      }

      expect(classCreateSchema.safeParse(validCredits).success).toBe(true)
      expect(classCreateSchema.safeParse(invalidCredits).success).toBe(false)
    })
  })

  describe("classUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        name: "Updated Class",
      }

      const result = classUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "class-123",
        name: "Updated Class",
      }

      const result = classUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe("getClassesSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getClassesSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
      expect(result.name).toBe("")
      expect(result.subjectId).toBe("")
      expect(result.teacherId).toBe("")
      expect(result.termId).toBe("")
      expect(result.sort).toEqual([])
    })

    it("validates pagination limits", () => {
      const tooMany = { perPage: 201 }
      const valid = { perPage: 100 }

      expect(getClassesSchema.safeParse(tooMany).success).toBe(false)
      expect(getClassesSchema.safeParse(valid).success).toBe(true)
    })
  })
})
