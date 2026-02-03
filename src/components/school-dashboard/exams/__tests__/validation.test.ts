import { describe, expect, it } from "vitest"
import { z } from "zod"

// Exam validation schema tests
describe("Exam Validation Schemas", () => {
  const examBaseSchema = z
    .object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      subjectId: z.string().min(1, "Subject is required"),
      classId: z.string().optional(),
      termId: z.string().optional(),
      date: z.string().min(1, "Date is required"),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      duration: z.number().min(1).max(480).optional(), // Minutes, max 8 hours
      totalMarks: z.number().positive("Total marks must be positive"),
      passingMarks: z.number().positive().optional(),
      type: z
        .enum([
          "MIDTERM",
          "FINAL",
          "QUIZ",
          "UNIT_TEST",
          "PRACTICAL",
          "ORAL",
          "OTHER",
        ])
        .default("OTHER"),
      status: z
        .enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .default("DRAFT"),
      instructions: z.string().optional(),
      venue: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.passingMarks && data.passingMarks > data.totalMarks) {
          return false
        }
        return true
      },
      {
        message: "Passing marks cannot exceed total marks",
        path: ["passingMarks"],
      }
    )

  const examCreateSchema = examBaseSchema

  const examUpdateSchema = examBaseSchema.partial().extend({
    id: z.string().min(1, "ID is required"),
  })

  const getExamsSchema = z.object({
    page: z.number().int().positive().default(1),
    perPage: z.number().int().positive().max(100).default(20),
    subjectId: z.string().optional(),
    classId: z.string().optional(),
    termId: z.string().optional(),
    type: z
      .enum([
        "MIDTERM",
        "FINAL",
        "QUIZ",
        "UNIT_TEST",
        "PRACTICAL",
        "ORAL",
        "OTHER",
      ])
      .optional(),
    status: z
      .enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
      .optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })

  describe("examCreateSchema", () => {
    it("validates complete exam data", () => {
      const validData = {
        title: "Midterm Mathematics Exam",
        description: "Chapters 1-5",
        subjectId: "subject-123",
        classId: "class-123",
        termId: "term-123",
        date: "2024-10-15",
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        type: "MIDTERM",
        status: "SCHEDULED",
        instructions: "No calculators allowed",
        venue: "Exam Hall A",
      }

      const result = examCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires title, subjectId, date, and totalMarks", () => {
      const missingTitle = {
        subjectId: "subject-123",
        date: "2024-10-15",
        totalMarks: 100,
      }

      const missingSubject = {
        title: "Exam",
        date: "2024-10-15",
        totalMarks: 100,
      }

      const missingDate = {
        title: "Exam",
        subjectId: "subject-123",
        totalMarks: 100,
      }

      const missingMarks = {
        title: "Exam",
        subjectId: "subject-123",
        date: "2024-10-15",
      }

      expect(examCreateSchema.safeParse(missingTitle).success).toBe(false)
      expect(examCreateSchema.safeParse(missingSubject).success).toBe(false)
      expect(examCreateSchema.safeParse(missingDate).success).toBe(false)
      expect(examCreateSchema.safeParse(missingMarks).success).toBe(false)
    })

    it("validates total marks is positive", () => {
      const validMarks = {
        title: "Exam",
        subjectId: "s1",
        date: "2024-10-15",
        totalMarks: 100,
      }

      const zeroMarks = {
        title: "Exam",
        subjectId: "s1",
        date: "2024-10-15",
        totalMarks: 0,
      }

      const negativeMarks = {
        title: "Exam",
        subjectId: "s1",
        date: "2024-10-15",
        totalMarks: -50,
      }

      expect(examCreateSchema.safeParse(validMarks).success).toBe(true)
      expect(examCreateSchema.safeParse(zeroMarks).success).toBe(false)
      expect(examCreateSchema.safeParse(negativeMarks).success).toBe(false)
    })

    it("validates passing marks does not exceed total", () => {
      const valid = {
        title: "Exam",
        subjectId: "s1",
        date: "2024-10-15",
        totalMarks: 100,
        passingMarks: 40,
      }

      const invalid = {
        title: "Exam",
        subjectId: "s1",
        date: "2024-10-15",
        totalMarks: 100,
        passingMarks: 150, // More than total
      }

      expect(examCreateSchema.safeParse(valid).success).toBe(true)
      expect(examCreateSchema.safeParse(invalid).success).toBe(false)
    })

    it("validates exam type enum", () => {
      const validTypes = [
        "MIDTERM",
        "FINAL",
        "QUIZ",
        "UNIT_TEST",
        "PRACTICAL",
        "ORAL",
        "OTHER",
      ]

      validTypes.forEach((type) => {
        const data = {
          title: "Exam",
          subjectId: "s1",
          date: "2024-10-15",
          totalMarks: 100,
          type,
        }
        expect(examCreateSchema.safeParse(data).success).toBe(true)
      })
    })

    it("validates status enum", () => {
      const validStatuses = [
        "DRAFT",
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ]

      validStatuses.forEach((status) => {
        const data = {
          title: "Exam",
          subjectId: "s1",
          date: "2024-10-15",
          totalMarks: 100,
          status,
        }
        expect(examCreateSchema.safeParse(data).success).toBe(true)
      })
    })

    it("validates duration range", () => {
      const validDuration = {
        title: "Exam",
        subjectId: "s1",
        date: "2024-10-15",
        totalMarks: 100,
        duration: 120,
      }

      const tooLong = {
        title: "Exam",
        subjectId: "s1",
        date: "2024-10-15",
        totalMarks: 100,
        duration: 600, // Over 8 hours
      }

      expect(examCreateSchema.safeParse(validDuration).success).toBe(true)
      expect(examCreateSchema.safeParse(tooLong).success).toBe(false)
    })

    it("applies defaults", () => {
      const minimal = {
        title: "Exam",
        subjectId: "s1",
        date: "2024-10-15",
        totalMarks: 100,
      }

      const result = examCreateSchema.parse(minimal)
      expect(result.type).toBe("OTHER")
      expect(result.status).toBe("DRAFT")
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
        status: "COMPLETED",
        venue: "New Venue",
      }

      const result = examUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
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
        subjectId: "subject-123",
        classId: "class-123",
        type: "MIDTERM",
        status: "SCHEDULED",
        dateFrom: "2024-10-01",
        dateTo: "2024-10-31",
      }

      const result = getExamsSchema.safeParse(withFilters)
      expect(result.success).toBe(true)
    })
  })
})
