import { describe, expect, it } from "vitest"
import { z } from "zod"

// Timetable validation schema tests
describe("Timetable Validation Schemas", () => {
  const dayOfWeekEnum = z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ])

  const timetableEntrySchema = z.object({
    classId: z.string().min(1, "Class is required"),
    subjectId: z.string().min(1, "Subject is required"),
    teacherId: z.string().min(1, "Teacher is required"),
    classroomId: z.string().optional(),
    dayOfWeek: dayOfWeekEnum,
    periodId: z.string().min(1, "Period is required"),
    termId: z.string().optional(),
    yearId: z.string().optional(),
    isRecurring: z.boolean().default(true),
  })

  const timetableUpdateSchema = timetableEntrySchema.partial().extend({
    id: z.string().min(1, "ID is required"),
  })

  const bulkTimetableSchema = z.object({
    classId: z.string().min(1, "Class is required"),
    termId: z.string().optional(),
    entries: z
      .array(
        z.object({
          subjectId: z.string().min(1),
          teacherId: z.string().min(1),
          dayOfWeek: dayOfWeekEnum,
          periodId: z.string().min(1),
          classroomId: z.string().optional(),
        })
      )
      .min(1, "At least one entry is required"),
    clearExisting: z.boolean().default(false),
  })

  const getTimetableSchema = z.object({
    classId: z.string().optional(),
    teacherId: z.string().optional(),
    studentId: z.string().optional(),
    classroomId: z.string().optional(),
    termId: z.string().optional(),
    yearId: z.string().optional(),
    dayOfWeek: dayOfWeekEnum.optional(),
    week: z.string().optional(), // ISO week format
  })

  const conflictCheckSchema = z
    .object({
      teacherId: z.string().optional(),
      classroomId: z.string().optional(),
      classId: z.string().optional(),
      dayOfWeek: dayOfWeekEnum,
      periodId: z.string().min(1),
      excludeId: z.string().optional(), // Exclude self when updating
    })
    .refine((data) => data.teacherId || data.classroomId || data.classId, {
      message: "At least one of teacherId, classroomId, or classId is required",
    })

  describe("timetableEntrySchema", () => {
    it("validates complete timetable entry", () => {
      const validData = {
        classId: "class-123",
        subjectId: "subject-123",
        teacherId: "teacher-123",
        classroomId: "room-123",
        dayOfWeek: "MONDAY",
        periodId: "period-1",
        termId: "term-123",
        yearId: "year-123",
        isRecurring: true,
      }

      const result = timetableEntrySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires mandatory fields", () => {
      const missingClass = {
        subjectId: "s1",
        teacherId: "t1",
        dayOfWeek: "MONDAY",
        periodId: "p1",
      }

      const missingSubject = {
        classId: "c1",
        teacherId: "t1",
        dayOfWeek: "MONDAY",
        periodId: "p1",
      }

      const missingTeacher = {
        classId: "c1",
        subjectId: "s1",
        dayOfWeek: "MONDAY",
        periodId: "p1",
      }

      expect(timetableEntrySchema.safeParse(missingClass).success).toBe(false)
      expect(timetableEntrySchema.safeParse(missingSubject).success).toBe(false)
      expect(timetableEntrySchema.safeParse(missingTeacher).success).toBe(false)
    })

    it("validates dayOfWeek enum", () => {
      const validDays = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ]

      validDays.forEach((dayOfWeek) => {
        const data = {
          classId: "c1",
          subjectId: "s1",
          teacherId: "t1",
          dayOfWeek,
          periodId: "p1",
        }
        expect(timetableEntrySchema.safeParse(data).success).toBe(true)
      })

      const invalidDay = {
        classId: "c1",
        subjectId: "s1",
        teacherId: "t1",
        dayOfWeek: "FUNDAY",
        periodId: "p1",
      }
      expect(timetableEntrySchema.safeParse(invalidDay).success).toBe(false)
    })

    it("applies default for isRecurring", () => {
      const minimal = {
        classId: "c1",
        subjectId: "s1",
        teacherId: "t1",
        dayOfWeek: "MONDAY",
        periodId: "p1",
      }

      const result = timetableEntrySchema.parse(minimal)
      expect(result.isRecurring).toBe(true)
    })
  })

  describe("timetableUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        teacherId: "new-teacher",
      }

      const result = timetableUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "entry-123",
        classroomId: "new-room",
      }

      const result = timetableUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe("bulkTimetableSchema", () => {
    it("validates bulk timetable data", () => {
      const validData = {
        classId: "class-123",
        termId: "term-123",
        entries: [
          {
            subjectId: "s1",
            teacherId: "t1",
            dayOfWeek: "MONDAY",
            periodId: "p1",
          },
          {
            subjectId: "s2",
            teacherId: "t2",
            dayOfWeek: "MONDAY",
            periodId: "p2",
          },
          {
            subjectId: "s1",
            teacherId: "t1",
            dayOfWeek: "TUESDAY",
            periodId: "p1",
          },
        ],
        clearExisting: true,
      }

      const result = bulkTimetableSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires at least one entry", () => {
      const emptyEntries = {
        classId: "class-123",
        entries: [],
      }

      const result = bulkTimetableSchema.safeParse(emptyEntries)
      expect(result.success).toBe(false)
    })

    it("validates each entry in bulk", () => {
      const invalidEntry = {
        classId: "class-123",
        entries: [
          {
            subjectId: "s1",
            teacherId: "t1",
            dayOfWeek: "MONDAY",
            periodId: "p1",
          },
          {
            subjectId: "",
            teacherId: "t2",
            dayOfWeek: "MONDAY",
            periodId: "p2",
          }, // Invalid
        ],
      }

      const result = bulkTimetableSchema.safeParse(invalidEntry)
      expect(result.success).toBe(false)
    })

    it("applies default for clearExisting", () => {
      const minimal = {
        classId: "class-123",
        entries: [
          {
            subjectId: "s1",
            teacherId: "t1",
            dayOfWeek: "MONDAY",
            periodId: "p1",
          },
        ],
      }

      const result = bulkTimetableSchema.parse(minimal)
      expect(result.clearExisting).toBe(false)
    })
  })

  describe("getTimetableSchema", () => {
    it("accepts various filter combinations", () => {
      const byClass = { classId: "class-123" }
      const byTeacher = { teacherId: "teacher-123" }
      const byStudent = { studentId: "student-123" }
      const byRoom = { classroomId: "room-123" }
      const byDay = { classId: "class-123", dayOfWeek: "MONDAY" }

      expect(getTimetableSchema.safeParse(byClass).success).toBe(true)
      expect(getTimetableSchema.safeParse(byTeacher).success).toBe(true)
      expect(getTimetableSchema.safeParse(byStudent).success).toBe(true)
      expect(getTimetableSchema.safeParse(byRoom).success).toBe(true)
      expect(getTimetableSchema.safeParse(byDay).success).toBe(true)
    })

    it("accepts empty filters (get all)", () => {
      const result = getTimetableSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe("conflictCheckSchema", () => {
    it("validates conflict check with teacher", () => {
      const validData = {
        teacherId: "teacher-123",
        dayOfWeek: "MONDAY",
        periodId: "period-1",
      }

      const result = conflictCheckSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("validates conflict check with classroom", () => {
      const validData = {
        classroomId: "room-123",
        dayOfWeek: "MONDAY",
        periodId: "period-1",
      }

      const result = conflictCheckSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires at least one of teacherId, classroomId, or classId", () => {
      const noTarget = {
        dayOfWeek: "MONDAY",
        periodId: "period-1",
      }

      const result = conflictCheckSchema.safeParse(noTarget)
      expect(result.success).toBe(false)
    })

    it("allows excludeId for update scenarios", () => {
      const withExclude = {
        teacherId: "teacher-123",
        dayOfWeek: "MONDAY",
        periodId: "period-1",
        excludeId: "entry-123",
      }

      const result = conflictCheckSchema.safeParse(withExclude)
      expect(result.success).toBe(true)
    })
  })
})
