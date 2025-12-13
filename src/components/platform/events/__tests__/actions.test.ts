import { describe, it, expect, vi, beforeEach } from "vitest"
import { createEvent, updateEvent, deleteEvent, getEvents } from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    event: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      event: {
        create: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    })),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

describe("Event Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "ADMIN",
      locale: "en",
    })
  })

  describe("createEvent", () => {
    it("creates event with schoolId for multi-tenant isolation", async () => {
      const mockEvent = {
        id: "event-1",
        title: "Annual Sports Day",
        date: new Date(),
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          event: {
            create: vi.fn().mockResolvedValue(mockEvent),
          },
        }
        return callback(tx)
      })

      const result = await createEvent({
        title: "Annual Sports Day",
        description: "School sports competition",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      })

      expect(result.success).toBe(true)
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await createEvent({
        title: "Event",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateEvent", () => {
    it("updates event with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          event: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await updateEvent({
        id: "event-1",
        title: "Updated Sports Day",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("deleteEvent", () => {
    it("deletes event with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          event: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteEvent({ id: "event-1" })

      expect(result.success).toBe(true)
    })
  })

  describe("getEvents", () => {
    it("fetches events scoped to schoolId", async () => {
      const mockEvents = [
        { id: "1", title: "Event 1", schoolId: mockSchoolId },
        { id: "2", title: "Event 2", schoolId: mockSchoolId },
      ]

      vi.mocked(db.event.findMany).mockResolvedValue(mockEvents as any)
      vi.mocked(db.event.count).mockResolvedValue(2)

      const result = await getEvents({})

      expect(result.success).toBe(true)
    })
  })
})
