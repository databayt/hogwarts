import { describe, expect, it } from "vitest"
import { z } from "zod"

// Events validation schema tests
describe("Event Validation Schemas", () => {
  const eventBaseSchema = z
    .object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      location: z.string().optional(),
      type: z
        .enum([
          "ACADEMIC",
          "SPORTS",
          "CULTURAL",
          "HOLIDAY",
          "MEETING",
          "EXAMINATION",
          "OTHER",
        ])
        .default("OTHER"),
      isAllDay: z.boolean().default(false),
      isRecurring: z.boolean().default(false),
      visibility: z
        .enum([
          "PUBLIC",
          "STAFF_ONLY",
          "STUDENTS_ONLY",
          "PARENTS_ONLY",
          "PRIVATE",
        ])
        .default("PUBLIC"),
      color: z.string().optional(),
      attachments: z.array(z.string()).optional(),
    })
    .refine(
      (data) => {
        const start = new Date(data.startDate)
        const end = new Date(data.endDate)
        return end >= start
      },
      {
        message: "End date must be after or equal to start date",
        path: ["endDate"],
      }
    )

  const eventCreateSchema = eventBaseSchema

  const eventUpdateSchema = eventBaseSchema.partial().extend({
    id: z.string().min(1, "ID is required"),
  })

  const getEventsSchema = z.object({
    page: z.number().int().positive().default(1),
    perPage: z.number().int().positive().max(100).default(20),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z
      .enum([
        "ACADEMIC",
        "SPORTS",
        "CULTURAL",
        "HOLIDAY",
        "MEETING",
        "EXAMINATION",
        "OTHER",
      ])
      .optional(),
    visibility: z
      .enum([
        "PUBLIC",
        "STAFF_ONLY",
        "STUDENTS_ONLY",
        "PARENTS_ONLY",
        "PRIVATE",
      ])
      .optional(),
    search: z.string().optional(),
  })

  describe("eventCreateSchema", () => {
    it("validates complete event data", () => {
      const validData = {
        title: "Annual Sports Day",
        description: "School-wide sports competition",
        startDate: "2024-10-15T09:00:00",
        endDate: "2024-10-15T17:00:00",
        location: "School Ground",
        type: "SPORTS",
        isAllDay: false,
        isRecurring: false,
        visibility: "PUBLIC",
        color: "#4CAF50",
      }

      const result = eventCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires title, startDate, and endDate", () => {
      const missingTitle = {
        startDate: "2024-10-15T09:00:00",
        endDate: "2024-10-15T17:00:00",
      }

      const missingStartDate = {
        title: "Event",
        endDate: "2024-10-15T17:00:00",
      }

      const missingEndDate = {
        title: "Event",
        startDate: "2024-10-15T09:00:00",
      }

      expect(eventCreateSchema.safeParse(missingTitle).success).toBe(false)
      expect(eventCreateSchema.safeParse(missingStartDate).success).toBe(false)
      expect(eventCreateSchema.safeParse(missingEndDate).success).toBe(false)
    })

    it("validates end date is after start date", () => {
      const validDates = {
        title: "Event",
        startDate: "2024-10-15T09:00:00",
        endDate: "2024-10-15T17:00:00",
      }

      const invalidDates = {
        title: "Event",
        startDate: "2024-10-15T17:00:00",
        endDate: "2024-10-15T09:00:00", // End before start
      }

      expect(eventCreateSchema.safeParse(validDates).success).toBe(true)
      expect(eventCreateSchema.safeParse(invalidDates).success).toBe(false)
    })

    it("validates event type enum", () => {
      const validTypes = [
        "ACADEMIC",
        "SPORTS",
        "CULTURAL",
        "HOLIDAY",
        "MEETING",
        "EXAMINATION",
        "OTHER",
      ]

      validTypes.forEach((type) => {
        const data = {
          title: "Event",
          startDate: "2024-10-15T09:00:00",
          endDate: "2024-10-15T17:00:00",
          type,
        }
        expect(eventCreateSchema.safeParse(data).success).toBe(true)
      })

      const invalidType = {
        title: "Event",
        startDate: "2024-10-15T09:00:00",
        endDate: "2024-10-15T17:00:00",
        type: "INVALID_TYPE",
      }
      expect(eventCreateSchema.safeParse(invalidType).success).toBe(false)
    })

    it("validates visibility enum", () => {
      const validVisibilities = [
        "PUBLIC",
        "STAFF_ONLY",
        "STUDENTS_ONLY",
        "PARENTS_ONLY",
        "PRIVATE",
      ]

      validVisibilities.forEach((visibility) => {
        const data = {
          title: "Event",
          startDate: "2024-10-15T09:00:00",
          endDate: "2024-10-15T17:00:00",
          visibility,
        }
        expect(eventCreateSchema.safeParse(data).success).toBe(true)
      })
    })

    it("applies defaults", () => {
      const minimal = {
        title: "Event",
        startDate: "2024-10-15T09:00:00",
        endDate: "2024-10-15T17:00:00",
      }

      const result = eventCreateSchema.parse(minimal)
      expect(result.type).toBe("OTHER")
      expect(result.isAllDay).toBe(false)
      expect(result.isRecurring).toBe(false)
      expect(result.visibility).toBe("PUBLIC")
    })
  })

  describe("eventUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        title: "Updated Event",
      }

      const result = eventUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "event-123",
        title: "Updated Event Title",
        location: "New Location",
      }

      const result = eventUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe("getEventsSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getEventsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
    })

    it("accepts filter parameters", () => {
      const withFilters = {
        startDate: "2024-10-01",
        endDate: "2024-10-31",
        type: "SPORTS",
        visibility: "PUBLIC",
        search: "sports day",
      }

      const result = getEventsSchema.safeParse(withFilters)
      expect(result.success).toBe(true)
    })

    it("validates pagination limits", () => {
      const tooMany = { perPage: 101 }
      const valid = { perPage: 50 }

      expect(getEventsSchema.safeParse(tooMany).success).toBe(false)
      expect(getEventsSchema.safeParse(valid).success).toBe(true)
    })
  })
})
