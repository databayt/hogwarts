import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { createEvent, deleteEvent, getEvents, updateEvent } from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    event: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        event: {
          create: vi.fn(),
          findFirst: vi.fn(),
          updateMany: vi.fn(),
          deleteMany: vi.fn(),
        },
      })
    ),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

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
        eventDate: new Date(),
        schoolId: mockSchoolId,
      }

      vi.mocked(db.event.create).mockResolvedValue(mockEvent as any)

      const result = await createEvent({
        title: "Annual Sports Day",
        description: "School sports competition",
        eventType: "SPORTS",
        eventDate: new Date(Date.now() + 86400000), // Tomorrow
        startTime: "09:00",
        endTime: "17:00",
        isPublic: true,
        registrationRequired: false,
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
        eventType: "ACADEMIC",
        eventDate: new Date(Date.now() + 86400000),
        startTime: "09:00",
        endTime: "10:00",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateEvent", () => {
    it("updates event with schoolId scope", async () => {
      // Mock event exists
      vi.mocked(db.event.findFirst).mockResolvedValue({
        id: "event-1",
        schoolId: mockSchoolId,
      } as any)
      // Mock update success
      vi.mocked(db.event.update).mockResolvedValue({
        id: "event-1",
        title: "Updated Sports Day",
      } as any)

      const result = await updateEvent({
        id: "event-1",
        title: "Updated Sports Day",
      })

      expect(result.success).toBe(true)
    })

    it("prevents updating event from different school", async () => {
      // Mock event not found in this school
      vi.mocked(db.event.findFirst).mockResolvedValue(null)

      const result = await updateEvent({
        id: "event-from-other-school",
        title: "Hacked Event",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("deleteEvent", () => {
    it("deletes event with schoolId scope", async () => {
      // Mock event exists
      vi.mocked(db.event.findFirst).mockResolvedValue({
        id: "event-1",
        schoolId: mockSchoolId,
      } as any)
      // Mock delete success
      vi.mocked(db.event.delete).mockResolvedValue({
        id: "event-1",
      } as any)

      const result = await deleteEvent({ id: "event-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deleting event from different school", async () => {
      // Mock event not found in this school
      vi.mocked(db.event.findFirst).mockResolvedValue(null)

      const result = await deleteEvent({ id: "event-from-other-school" })

      expect(result.success).toBe(false)
    })
  })

  describe("getEvents", () => {
    it("fetches events scoped to schoolId", async () => {
      const now = new Date()
      const mockEvents = [
        {
          id: "1",
          title: "Event 1",
          schoolId: mockSchoolId,
          eventType: "ACADEMIC",
          status: "UPCOMING",
          eventDate: now,
          startTime: "09:00",
          endTime: "10:00",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "2",
          title: "Event 2",
          schoolId: mockSchoolId,
          eventType: "SPORTS",
          status: "UPCOMING",
          eventDate: now,
          startTime: "10:00",
          endTime: "11:00",
          createdAt: now,
          updatedAt: now,
        },
      ]

      vi.mocked(db.event.findMany).mockResolvedValue(mockEvents as any)
      vi.mocked(db.event.count).mockResolvedValue(2)

      const result = await getEvents({})

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
    })
  })
})
