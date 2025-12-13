import { describe, it, expect } from "vitest"
import { z } from "zod"

// Announcements validation schema tests
describe("Announcement Validation Schemas", () => {
  const audienceEnum = z.enum(["ALL", "STUDENTS", "TEACHERS", "PARENTS", "STAFF", "ADMINS"])

  const announcementBaseSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    content: z.string().min(1, "Content is required"),
    audience: z.array(audienceEnum).min(1, "At least one audience is required"),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    category: z.enum(["GENERAL", "ACADEMIC", "ADMINISTRATIVE", "EVENTS", "EMERGENCY"]).default("GENERAL"),
    publishAt: z.string().optional(),
    expiresAt: z.string().optional(),
    isPinned: z.boolean().default(false),
    attachments: z.array(z.string()).optional(),
    sendNotification: z.boolean().default(true),
    sendEmail: z.boolean().default(false),
  })

  const announcementCreateSchema = announcementBaseSchema

  const announcementUpdateSchema = announcementBaseSchema.partial().extend({
    id: z.string().min(1, "ID is required"),
  })

  const getAnnouncementsSchema = z.object({
    page: z.number().int().positive().default(1),
    perPage: z.number().int().positive().max(50).default(10),
    audience: audienceEnum.optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    category: z.enum(["GENERAL", "ACADEMIC", "ADMINISTRATIVE", "EVENTS", "EMERGENCY"]).optional(),
    search: z.string().optional(),
    isPinned: z.boolean().optional(),
    includeExpired: z.boolean().default(false),
  })

  describe("announcementCreateSchema", () => {
    it("validates complete announcement data", () => {
      const validData = {
        title: "Important School Update",
        content: "We are pleased to announce...",
        audience: ["ALL"],
        priority: "HIGH",
        category: "ADMINISTRATIVE",
        publishAt: "2024-09-15T09:00:00",
        expiresAt: "2024-09-30T23:59:59",
        isPinned: true,
        attachments: ["doc1.pdf"],
        sendNotification: true,
        sendEmail: true,
      }

      const result = announcementCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires title, content, and audience", () => {
      const missingTitle = {
        content: "Content here",
        audience: ["ALL"],
      }

      const missingContent = {
        title: "Title",
        audience: ["ALL"],
      }

      const missingAudience = {
        title: "Title",
        content: "Content here",
      }

      expect(announcementCreateSchema.safeParse(missingTitle).success).toBe(false)
      expect(announcementCreateSchema.safeParse(missingContent).success).toBe(false)
      expect(announcementCreateSchema.safeParse(missingAudience).success).toBe(false)
    })

    it("validates title length", () => {
      const validTitle = {
        title: "Short Title",
        content: "Content",
        audience: ["ALL"],
      }

      const tooLongTitle = {
        title: "A".repeat(201), // Over 200 chars
        content: "Content",
        audience: ["ALL"],
      }

      expect(announcementCreateSchema.safeParse(validTitle).success).toBe(true)
      expect(announcementCreateSchema.safeParse(tooLongTitle).success).toBe(false)
    })

    it("validates audience enum values", () => {
      const validAudiences = ["ALL", "STUDENTS", "TEACHERS", "PARENTS", "STAFF", "ADMINS"]

      validAudiences.forEach((audience) => {
        const data = {
          title: "Title",
          content: "Content",
          audience: [audience],
        }
        expect(announcementCreateSchema.safeParse(data).success).toBe(true)
      })

      const invalidAudience = {
        title: "Title",
        content: "Content",
        audience: ["INVALID"],
      }
      expect(announcementCreateSchema.safeParse(invalidAudience).success).toBe(false)
    })

    it("allows multiple audiences", () => {
      const multipleAudiences = {
        title: "Title",
        content: "Content",
        audience: ["STUDENTS", "TEACHERS", "PARENTS"],
      }

      const result = announcementCreateSchema.safeParse(multipleAudiences)
      expect(result.success).toBe(true)
    })

    it("requires at least one audience", () => {
      const emptyAudience = {
        title: "Title",
        content: "Content",
        audience: [],
      }

      const result = announcementCreateSchema.safeParse(emptyAudience)
      expect(result.success).toBe(false)
    })

    it("validates priority enum", () => {
      const validPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"]

      validPriorities.forEach((priority) => {
        const data = {
          title: "Title",
          content: "Content",
          audience: ["ALL"],
          priority,
        }
        expect(announcementCreateSchema.safeParse(data).success).toBe(true)
      })
    })

    it("validates category enum", () => {
      const validCategories = ["GENERAL", "ACADEMIC", "ADMINISTRATIVE", "EVENTS", "EMERGENCY"]

      validCategories.forEach((category) => {
        const data = {
          title: "Title",
          content: "Content",
          audience: ["ALL"],
          category,
        }
        expect(announcementCreateSchema.safeParse(data).success).toBe(true)
      })
    })

    it("applies defaults", () => {
      const minimal = {
        title: "Title",
        content: "Content",
        audience: ["ALL"],
      }

      const result = announcementCreateSchema.parse(minimal)
      expect(result.priority).toBe("NORMAL")
      expect(result.category).toBe("GENERAL")
      expect(result.isPinned).toBe(false)
      expect(result.sendNotification).toBe(true)
      expect(result.sendEmail).toBe(false)
    })
  })

  describe("announcementUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        title: "Updated Title",
      }

      const result = announcementUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "announcement-123",
        isPinned: true,
        priority: "URGENT",
      }

      const result = announcementUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe("getAnnouncementsSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getAnnouncementsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
      expect(result.includeExpired).toBe(false)
    })

    it("accepts filter parameters", () => {
      const withFilters = {
        audience: "STUDENTS",
        priority: "HIGH",
        category: "ACADEMIC",
        search: "important",
        isPinned: true,
      }

      const result = getAnnouncementsSchema.safeParse(withFilters)
      expect(result.success).toBe(true)
    })

    it("validates pagination limits", () => {
      const tooMany = { perPage: 51 }
      const valid = { perPage: 25 }

      expect(getAnnouncementsSchema.safeParse(tooMany).success).toBe(false)
      expect(getAnnouncementsSchema.safeParse(valid).success).toBe(true)
    })
  })
})
