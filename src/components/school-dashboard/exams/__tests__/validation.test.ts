import { describe, expect, it } from "vitest"

import {
  examCreateSchema,
  examUpdateSchema,
  getExamsSchema,
} from "../manage/validation"

describe("Exam Validation Schemas", () => {
  // Helper to create a future date for testing
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)

  describe("examCreateSchema", () => {
    it("validates complete exam data", () => {
      const validData = {
        title: "Midterm Mathematics Exam",
        description: "Chapters 1-5",
        classId: "class-123",
        subjectId: "subject-123",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM" as const,
        instructions: "No calculators allowed",
      }

      const result = examCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires title, classId, subjectId, examDate, startTime, endTime, duration, totalMarks, passingMarks, examType", () => {
      const missingTitle = {
        classId: "class-123",
        subjectId: "subject-123",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM" as const,
      }

      const missingClass = {
        title: "Exam",
        subjectId: "subject-123",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM" as const,
      }

      expect(examCreateSchema.safeParse(missingTitle).success).toBe(false)
      expect(examCreateSchema.safeParse(missingClass).success).toBe(false)
    })

    it("validates total marks is positive", () => {
      const base = {
        title: "Exam",
        classId: "c1",
        subjectId: "s1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        passingMarks: 40,
        examType: "MIDTERM" as const,
      }

      expect(
        examCreateSchema.safeParse({ ...base, totalMarks: 100 }).success
      ).toBe(true)
      expect(
        examCreateSchema.safeParse({ ...base, totalMarks: 0 }).success
      ).toBe(false)
      expect(
        examCreateSchema.safeParse({ ...base, totalMarks: -50 }).success
      ).toBe(false)
    })

    it("validates passing marks does not exceed total", () => {
      const base = {
        title: "Exam",
        classId: "c1",
        subjectId: "s1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        examType: "MIDTERM" as const,
      }

      expect(
        examCreateSchema.safeParse({
          ...base,
          totalMarks: 100,
          passingMarks: 40,
        }).success
      ).toBe(true)
      expect(
        examCreateSchema.safeParse({
          ...base,
          totalMarks: 100,
          passingMarks: 150,
        }).success
      ).toBe(false)
    })

    it("validates exam type enum matches Prisma ExamType", () => {
      const validTypes = [
        "MIDTERM",
        "FINAL",
        "QUIZ",
        "TEST",
        "PRACTICAL",
      ] as const

      const base = {
        title: "Exam",
        classId: "c1",
        subjectId: "s1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
      }

      validTypes.forEach((examType) => {
        expect(examCreateSchema.safeParse({ ...base, examType }).success).toBe(
          true
        )
      })

      // Invalid types that were removed from the schema
      expect(
        examCreateSchema.safeParse({ ...base, examType: "UNIT_TEST" }).success
      ).toBe(false)
      expect(
        examCreateSchema.safeParse({ ...base, examType: "ORAL" }).success
      ).toBe(false)
      expect(
        examCreateSchema.safeParse({ ...base, examType: "OTHER" }).success
      ).toBe(false)
    })

    it("validates duration range (1-480 minutes)", () => {
      const base = {
        title: "Exam",
        classId: "c1",
        subjectId: "s1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM" as const,
      }

      expect(
        examCreateSchema.safeParse({ ...base, duration: 120 }).success
      ).toBe(true)
      expect(
        examCreateSchema.safeParse({ ...base, duration: 600 }).success
      ).toBe(false)
      expect(examCreateSchema.safeParse({ ...base, duration: 0 }).success).toBe(
        false
      )
    })

    it("validates end time is after start time", () => {
      const base = {
        title: "Exam",
        classId: "c1",
        subjectId: "s1",
        examDate: futureDate,
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM" as const,
      }

      expect(
        examCreateSchema.safeParse({
          ...base,
          startTime: "09:00",
          endTime: "11:00",
        }).success
      ).toBe(true)
      expect(
        examCreateSchema.safeParse({
          ...base,
          startTime: "11:00",
          endTime: "09:00",
        }).success
      ).toBe(false)
    })

    it("validates passing marks percentage is realistic (10%-90%)", () => {
      const base = {
        title: "Exam",
        classId: "c1",
        subjectId: "s1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        examType: "MIDTERM" as const,
      }

      // 40% - valid
      expect(
        examCreateSchema.safeParse({ ...base, passingMarks: 40 }).success
      ).toBe(true)
      // 5% - too low
      expect(
        examCreateSchema.safeParse({ ...base, passingMarks: 5 }).success
      ).toBe(false)
      // 95% - too high
      expect(
        examCreateSchema.safeParse({ ...base, passingMarks: 95 }).success
      ).toBe(false)
    })

    it("applies proctoring defaults", () => {
      const minimal = {
        title: "Exam",
        classId: "c1",
        subjectId: "s1",
        examDate: futureDate,
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM" as const,
      }

      const result = examCreateSchema.parse(minimal)
      expect(result.proctorMode).toBe("BASIC")
      expect(result.shuffleQuestions).toBe(true)
      expect(result.shuffleOptions).toBe(true)
      expect(result.maxAttempts).toBe(1)
      expect(result.forceCreate).toBe(false)
    })
  })

  describe("examUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        title: "Updated Exam",
      }

      const result = examUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "exam-123",
        title: "Updated Exam Title",
      }

      const result = examUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it("validates examType in updates", () => {
      expect(
        examUpdateSchema.safeParse({
          id: "exam-123",
          examType: "TEST",
        }).success
      ).toBe(true)

      expect(
        examUpdateSchema.safeParse({
          id: "exam-123",
          examType: "UNIT_TEST",
        }).success
      ).toBe(false)
    })
  })

  describe("getExamsSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getExamsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
    })

    it("accepts filter parameters", () => {
      const withFilters = {
        classId: "class-123",
        subjectId: "subject-123",
        examType: "MIDTERM",
        status: "PLANNED",
      }

      const result = getExamsSchema.safeParse(withFilters)
      expect(result.success).toBe(true)
    })
  })
})
