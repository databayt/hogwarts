import { describe, it, expect } from "vitest"
import { z } from "zod"

// Lessons validation schema tests
describe("Lesson Validation Schemas", () => {
  const lessonBaseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    classId: z.string().min(1, "Class is required"),
    subjectId: z.string().min(1, "Subject is required"),
    teacherId: z.string().optional(),
    date: z.string().optional(),
    duration: z.number().min(1).max(480).optional(), // Max 8 hours
    content: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    materials: z.array(z.string()).optional(),
    status: z.enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("DRAFT"),
  })

  const lessonCreateSchema = lessonBaseSchema

  const lessonUpdateSchema = lessonBaseSchema.partial().extend({
    id: z.string().min(1, "ID is required"),
  })

  const getLessonsSchema = z.object({
    page: z.number().int().positive().default(1),
    perPage: z.number().int().positive().max(100).default(20),
    classId: z.string().optional(),
    subjectId: z.string().optional(),
    teacherId: z.string().optional(),
    status: z.enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })

  describe("lessonCreateSchema", () => {
    it("validates complete lesson data", () => {
      const validData = {
        title: "Introduction to Algebra",
        description: "Basic algebraic concepts",
        classId: "class-123",
        subjectId: "subject-123",
        teacherId: "teacher-123",
        date: "2024-09-15",
        duration: 45,
        content: "Lesson content here...",
        objectives: ["Understand variables", "Solve basic equations"],
        materials: ["Textbook", "Worksheets"],
        status: "SCHEDULED",
      }

      const result = lessonCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires title, classId, and subjectId", () => {
      const missingTitle = {
        classId: "class-123",
        subjectId: "subject-123",
      }

      const missingClass = {
        title: "Lesson",
        subjectId: "subject-123",
      }

      const missingSubject = {
        title: "Lesson",
        classId: "class-123",
      }

      expect(lessonCreateSchema.safeParse(missingTitle).success).toBe(false)
      expect(lessonCreateSchema.safeParse(missingClass).success).toBe(false)
      expect(lessonCreateSchema.safeParse(missingSubject).success).toBe(false)
    })

    it("validates duration range", () => {
      const validDuration = {
        title: "Lesson",
        classId: "c1",
        subjectId: "s1",
        duration: 90,
      }

      const tooShort = {
        title: "Lesson",
        classId: "c1",
        subjectId: "s1",
        duration: 0,
      }

      const tooLong = {
        title: "Lesson",
        classId: "c1",
        subjectId: "s1",
        duration: 500, // Over 8 hours
      }

      expect(lessonCreateSchema.safeParse(validDuration).success).toBe(true)
      expect(lessonCreateSchema.safeParse(tooShort).success).toBe(false)
      expect(lessonCreateSchema.safeParse(tooLong).success).toBe(false)
    })

    it("validates status enum", () => {
      const validStatuses = ["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

      validStatuses.forEach((status) => {
        const data = {
          title: "Lesson",
          classId: "c1",
          subjectId: "s1",
          status,
        }
        expect(lessonCreateSchema.safeParse(data).success).toBe(true)
      })

      const invalidStatus = {
        title: "Lesson",
        classId: "c1",
        subjectId: "s1",
        status: "INVALID",
      }
      expect(lessonCreateSchema.safeParse(invalidStatus).success).toBe(false)
    })

    it("applies default status", () => {
      const withoutStatus = {
        title: "Lesson",
        classId: "c1",
        subjectId: "s1",
      }

      const result = lessonCreateSchema.parse(withoutStatus)
      expect(result.status).toBe("DRAFT")
    })
  })

  describe("lessonUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        title: "Updated Lesson",
      }

      const result = lessonUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "lesson-123",
        status: "COMPLETED",
        content: "Updated content",
      }

      const result = lessonUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it("validates objectives array format", () => {
      const validObjectives = {
        id: "lesson-123",
        objectives: ["Objective 1", "Objective 2"],
      }

      const invalidObjectives = {
        id: "lesson-123",
        objectives: "Not an array",
      }

      expect(lessonUpdateSchema.safeParse(validObjectives).success).toBe(true)
      expect(lessonUpdateSchema.safeParse(invalidObjectives).success).toBe(false)
    })
  })

  describe("getLessonsSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getLessonsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
    })

    it("accepts filter parameters", () => {
      const withFilters = {
        classId: "class-123",
        teacherId: "teacher-123",
        status: "SCHEDULED",
        dateFrom: "2024-09-01",
        dateTo: "2024-09-30",
      }

      const result = getLessonsSchema.safeParse(withFilters)
      expect(result.success).toBe(true)
    })

    it("validates status filter", () => {
      const validStatus = { status: "COMPLETED" }
      const invalidStatus = { status: "INVALID_STATUS" }

      expect(getLessonsSchema.safeParse(validStatus).success).toBe(true)
      expect(getLessonsSchema.safeParse(invalidStatus).success).toBe(false)
    })
  })
})
