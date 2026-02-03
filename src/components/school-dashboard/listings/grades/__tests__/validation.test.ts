import { describe, expect, it } from "vitest"
import { z } from "zod"

// Grades/Results validation schema tests
describe("Grades Validation Schemas", () => {
  const resultBaseSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    examId: z.string().min(1, "Exam is required"),
    subjectId: z.string().min(1, "Subject is required"),
    score: z
      .number()
      .min(0, "Score must be non-negative")
      .max(100, "Score cannot exceed 100"),
    grade: z.string().optional(),
    remarks: z.string().optional(),
    submittedBy: z.string().optional(),
  })

  const resultCreateSchema = resultBaseSchema

  const resultUpdateSchema = resultBaseSchema.partial().extend({
    id: z.string().min(1, "ID is required"),
  })

  const getResultsSchema = z.object({
    page: z.number().int().positive().default(1),
    perPage: z.number().int().positive().max(100).default(20),
    studentId: z.string().optional(),
    examId: z.string().optional(),
    subjectId: z.string().optional(),
    classId: z.string().optional(),
    minScore: z.number().min(0).optional(),
    maxScore: z.number().max(100).optional(),
  })

  describe("resultCreateSchema", () => {
    it("validates complete result data", () => {
      const validData = {
        studentId: "student-123",
        examId: "exam-123",
        subjectId: "subject-123",
        score: 85,
        grade: "A",
        remarks: "Excellent work",
      }

      const result = resultCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires mandatory fields", () => {
      const missingStudent = {
        examId: "exam-123",
        subjectId: "subject-123",
        score: 85,
      }

      const missingExam = {
        studentId: "student-123",
        subjectId: "subject-123",
        score: 85,
      }

      expect(resultCreateSchema.safeParse(missingStudent).success).toBe(false)
      expect(resultCreateSchema.safeParse(missingExam).success).toBe(false)
    })

    it("validates score range", () => {
      const validScore = {
        studentId: "s1",
        examId: "e1",
        subjectId: "sub1",
        score: 50,
      }

      const negativeScore = {
        studentId: "s1",
        examId: "e1",
        subjectId: "sub1",
        score: -5,
      }

      const overScore = {
        studentId: "s1",
        examId: "e1",
        subjectId: "sub1",
        score: 105,
      }

      expect(resultCreateSchema.safeParse(validScore).success).toBe(true)
      expect(resultCreateSchema.safeParse(negativeScore).success).toBe(false)
      expect(resultCreateSchema.safeParse(overScore).success).toBe(false)
    })

    it("accepts edge case scores", () => {
      const zeroScore = {
        studentId: "s1",
        examId: "e1",
        subjectId: "sub1",
        score: 0,
      }

      const perfectScore = {
        studentId: "s1",
        examId: "e1",
        subjectId: "sub1",
        score: 100,
      }

      expect(resultCreateSchema.safeParse(zeroScore).success).toBe(true)
      expect(resultCreateSchema.safeParse(perfectScore).success).toBe(true)
    })
  })

  describe("resultUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        score: 90,
      }

      const result = resultUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "result-123",
        score: 92,
        remarks: "Improved performance",
      }

      const result = resultUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it("still validates score range on update", () => {
      const invalidUpdate = {
        id: "result-123",
        score: 150, // Invalid
      }

      const result = resultUpdateSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe("getResultsSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getResultsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
    })

    it("accepts filter parameters", () => {
      const withFilters = {
        studentId: "student-123",
        examId: "exam-123",
        minScore: 60,
        maxScore: 90,
      }

      const result = getResultsSchema.safeParse(withFilters)
      expect(result.success).toBe(true)
    })

    it("validates score filter ranges", () => {
      const invalidMin = {
        minScore: -10,
      }

      const invalidMax = {
        maxScore: 150,
      }

      expect(getResultsSchema.safeParse(invalidMin).success).toBe(false)
      expect(getResultsSchema.safeParse(invalidMax).success).toBe(false)
    })
  })
})
