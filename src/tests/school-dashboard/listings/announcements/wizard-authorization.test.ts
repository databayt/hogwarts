// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Regression tests for the announcement wizard's RBAC.
 *
 * The wizard steps used to trust the tenant context alone. Because
 * `getTenantContext()` resolves schoolId from the `x-subdomain` header before
 * it consults the session, that let any caller who could reach the subdomain
 * drive createDraft -> updateContent -> updateTargeting({published:true,
 * scope:"school"}) and publish school-wide. These tests pin the fix.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { createDraftAnnouncement } from "@/components/school-dashboard/listings/announcements/wizard/actions"
import { updateAnnouncementContent } from "@/components/school-dashboard/listings/announcements/wizard/content/actions"
import { updateAnnouncementTargeting } from "@/components/school-dashboard/listings/announcements/wizard/targeting/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

vi.mock("@/lib/db", () => ({
  db: {
    announcement: {
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("next/server", async (orig) => ({
  ...((await orig()) as object),
  after: (fn: () => void) => fn(),
}))

vi.mock("@/components/translation/prewarm", () => ({ prewarm: vi.fn() }))

const SCHOOL = "school-123"

/** Sign in as `role`; the tenant always resolves, as it does from the header. */
function signInAs(role: string | null, userId = "user-1") {
  vi.mocked(auth).mockResolvedValue(
    role ? ({ user: { id: userId, role, schoolId: SCHOOL } } as any) : null
  )
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "test-school",
    role,
    locale: "en",
  } as any)
}

/** The announcement the guard loads to decide ownership. */
function existingAnnouncement(over: Record<string, unknown> = {}) {
  vi.mocked(db.announcement.findFirst).mockResolvedValue({
    id: "ann-1",
    schoolId: SCHOOL,
    createdBy: "admin-1",
    scope: "school",
    ...over,
  } as any)
}

describe("announcement wizard authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.announcement.create).mockResolvedValue({ id: "ann-1" } as any)
    vi.mocked(db.announcement.updateMany).mockResolvedValue({ count: 1 })
  })

  describe("createDraftAnnouncement", () => {
    it("rejects an unauthenticated caller even though the tenant resolves", async () => {
      signInAs(null)

      const result = await createDraftAnnouncement()

      expect(result.success).toBe(false)
      expect(db.announcement.create).not.toHaveBeenCalled()
    })

    it.each(["STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF"])(
      "refuses %s, who may not author announcements",
      async (role) => {
        signInAs(role)

        const result = await createDraftAnnouncement()

        expect(result.success).toBe(false)
        expect(db.announcement.create).not.toHaveBeenCalled()
      }
    )

    it("seeds an ADMIN draft as school-scoped and records the author", async () => {
      signInAs("ADMIN", "admin-1")

      const result = await createDraftAnnouncement()

      expect(result.success).toBe(true)
      expect(db.announcement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: SCHOOL,
            scope: "school",
            createdBy: "admin-1",
          }),
        })
      )
    })

    it("seeds a TEACHER draft as class-scoped, not school-wide", async () => {
      signInAs("TEACHER", "teacher-1")

      const result = await createDraftAnnouncement()

      expect(result.success).toBe(true)
      expect(db.announcement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ scope: "class" }),
        })
      )
    })
  })

  describe("updateAnnouncementContent", () => {
    it("rejects an unauthenticated caller", async () => {
      signInAs(null)
      existingAnnouncement()

      const result = await updateAnnouncementContent("ann-1", {
        title: "Injected",
        body: "Injected body",
        lang: "en",
      } as any)

      expect(result.success).toBe(false)
      expect(db.announcement.updateMany).not.toHaveBeenCalled()
    })

    it("refuses a STUDENT editing someone else's draft", async () => {
      signInAs("STUDENT", "student-1")
      existingAnnouncement({ createdBy: "admin-1" })

      const result = await updateAnnouncementContent("ann-1", {
        title: "Injected",
        body: "Injected body",
        lang: "en",
      } as any)

      expect(result.success).toBe(false)
      expect(db.announcement.updateMany).not.toHaveBeenCalled()
    })
  })

  describe("updateAnnouncementTargeting", () => {
    const publishSchoolWide = {
      scope: "school",
      published: true,
      pinned: false,
      featured: false,
    } as any

    it("refuses a STUDENT publishing school-wide (the escalation path)", async () => {
      signInAs("STUDENT", "student-1")
      existingAnnouncement({ createdBy: "admin-1" })

      const result = await updateAnnouncementTargeting(
        "ann-1",
        publishSchoolWide
      )

      expect(result.success).toBe(false)
      expect(db.announcement.updateMany).not.toHaveBeenCalled()
    })

    it("refuses a TEACHER widening their own class draft to school scope", async () => {
      signInAs("TEACHER", "teacher-1")
      existingAnnouncement({ createdBy: "teacher-1", scope: "class" })

      const result = await updateAnnouncementTargeting(
        "ann-1",
        publishSchoolWide
      )

      expect(result.success).toBe(false)
      expect(db.announcement.updateMany).not.toHaveBeenCalled()
    })

    it("lets a TEACHER publish to their own class", async () => {
      signInAs("TEACHER", "teacher-1")
      existingAnnouncement({ createdBy: "teacher-1", scope: "class" })

      const result = await updateAnnouncementTargeting("ann-1", {
        scope: "class",
        classId: "class-1",
        published: true,
        pinned: false,
        featured: false,
      } as any)

      expect(result.success).toBe(true)
      expect(db.announcement.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "ann-1", schoolId: SCHOOL }),
        })
      )
    })

    it("lets an ADMIN publish school-wide", async () => {
      signInAs("ADMIN", "admin-1")
      existingAnnouncement({ createdBy: "admin-1" })

      const result = await updateAnnouncementTargeting(
        "ann-1",
        publishSchoolWide
      )

      expect(result.success).toBe(true)
      expect(db.announcement.updateMany).toHaveBeenCalled()
    })
  })
})
