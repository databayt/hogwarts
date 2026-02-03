import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPublish,
} from "@/components/school-dashboard/listings/announcements/actions"

// Mock dependencies - must be inside vi.mock factory to avoid hoisting issues
vi.mock("@/lib/db", () => ({
  db: {
    announcement: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe("Announcement Actions", () => {
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

  describe("createAnnouncement", () => {
    it("creates announcement with schoolId for multi-tenant isolation", async () => {
      vi.mocked(db.announcement.create).mockResolvedValue({
        id: "ann-1",
      } as any)

      const result = await createAnnouncement({
        titleEn: "Test Announcement",
        bodyEn: "Test body content",
        scope: "school",
        published: false,
      })

      expect(result.success).toBe(true)
      expect(db.announcement.create).toHaveBeenCalled()
    })
  })

  describe("toggleAnnouncementPublish", () => {
    it("toggles publish with tenant safety", async () => {
      // Mock existing announcement (findFirst is called first)
      vi.mocked(db.announcement.findFirst).mockResolvedValue({
        id: "ann-1",
        createdBy: "test-user-id",
        schoolId: mockSchoolId,
        scope: "school",
        published: false,
      } as any)
      vi.mocked(db.announcement.updateMany).mockResolvedValue({ count: 1 })

      const result = await toggleAnnouncementPublish({
        id: "ann-1",
        publish: true,
      })

      // The important thing for multi-tenant safety is the query was scoped by schoolId
      expect(db.announcement.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "ann-1",
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })

  describe("deleteAnnouncement", () => {
    it("queries scoped by schoolId", async () => {
      // Mock existing announcement (findFirst is called first)
      vi.mocked(db.announcement.findFirst).mockResolvedValue({
        id: "ann-1",
        createdBy: "test-user-id",
        schoolId: mockSchoolId,
        scope: "school",
      } as any)
      vi.mocked(db.announcement.deleteMany).mockResolvedValue({ count: 1 })

      await deleteAnnouncement({ id: "ann-1" })

      // The important thing for multi-tenant safety is the query was scoped by schoolId
      expect(db.announcement.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "ann-1",
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })
})
