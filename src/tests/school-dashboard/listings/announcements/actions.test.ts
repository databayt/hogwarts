// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPublish,
  updateAnnouncement,
} from "@/components/school-dashboard/listings/announcements/actions"
import { prewarm } from "@/components/translation/prewarm"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

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

// Run `after()` callbacks synchronously so we can assert the prewarm side
// effect; preserve the rest of next/server.
vi.mock("next/server", async (orig) => ({
  ...((await orig()) as object),
  after: (fn: () => void) => fn(),
}))

vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn(),
}))

describe("Announcement Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    // Session schoolId must match the tenant-context schoolId for ADMIN
    // permission checks to pass.
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", schoolId: mockSchoolId },
    } as any)
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
        title: "Test Announcement",
        body: "Test body content",
        lang: "ar",
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

  describe("translation cache prewarm", () => {
    it("prewarms Announcement on successful update", async () => {
      vi.mocked(db.announcement.findFirst).mockResolvedValue({
        id: "ann-1",
        createdBy: "admin-1",
        schoolId: mockSchoolId,
        scope: "school",
        published: false,
      } as any)
      vi.mocked(db.announcement.updateMany).mockResolvedValue({ count: 1 })

      const result = await updateAnnouncement({
        id: "ann-1",
        title: "Updated Title",
        body: "Updated body",
      })

      expect(result.success).toBe(true)
      expect(prewarm).toHaveBeenCalledWith(
        "Announcement",
        expect.objectContaining({ id: "ann-1", title: "Updated Title" }),
        { schoolId: mockSchoolId }
      )
    })

    it("does NOT prewarm when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await updateAnnouncement({
        id: "ann-1",
        title: "Updated Title",
      })

      expect(result.success).toBe(false)
      expect(prewarm).not.toHaveBeenCalled()
    })
  })
})
