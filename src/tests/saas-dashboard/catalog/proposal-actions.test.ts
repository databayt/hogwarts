// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  dispatchNotification,
  dispatchNotificationsToAudience,
} from "@/lib/dispatch-notification"
import {
  approveProposal,
  getProposalsForReview,
  rejectProposal,
} from "@/components/saas-dashboard/catalog/proposal-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    proposal: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    subject: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    chapter: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    lesson: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    academicGrade: {
      findMany: vi.fn(),
    },
    subjectSelection: {
      createMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue("notif-1"),
  dispatchNotificationsToAudience: vi.fn().mockResolvedValue({ created: 1 }),
  resolveSchoolLang: vi.fn().mockResolvedValue("en"),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Helpers
// ============================================================================

function mockDeveloperSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "dev-1", role: "DEVELOPER" },
  } as any)
}

function mockNonDeveloperSession(role = "ADMIN") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role },
  } as any)
}

// ============================================================================
// Tests
// ============================================================================

describe("Proposal Actions (SaaS)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: $transaction runs the callback with the top-level db mock as `tx`,
    // so tests that mock db.<model> (CHAPTER/LESSON/error paths) drive the
    // transaction body. The SUBJECT test overrides this with a bespoke tx.
    vi.mocked(db.$transaction).mockImplementation((cb: any) => cb(db))
  })

  // ==========================================================================
  // getProposalsForReview
  // ==========================================================================

  describe("getProposalsForReview", () => {
    it("returns proposals list for DEVELOPER", async () => {
      mockDeveloperSession()

      const mockProposals = [
        {
          id: "p-1",
          type: "SUBJECT",
          status: "SUBMITTED",
          data: { name: "Physics" },
          schoolId: "school-1",
          school: { name: "Demo School" },
          proposedBy: "user-1",
          createdAt: new Date("2026-01-01"),
          parentSubjectId: null,
          parentChapterId: null,
        },
      ]
      vi.mocked(db.proposal.findMany).mockResolvedValue(mockProposals as any)

      const result = await getProposalsForReview()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].schoolName).toBe("Demo School")
      expect(result.data![0].type).toBe("SUBJECT")
    })

    it("filters by status when provided", async () => {
      mockDeveloperSession()
      vi.mocked(db.proposal.findMany).mockResolvedValue([])

      await getProposalsForReview("SUBMITTED")

      expect(db.proposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "SUBMITTED" },
        })
      )
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await getProposalsForReview()

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized: DEVELOPER role required")
    })
  })

  // ==========================================================================
  // approveProposal
  // ==========================================================================

  describe("approveProposal", () => {
    it("approves SUBJECT proposal (publishes only — NO auto-bridge, opt-in flow)", async () => {
      mockDeveloperSession()

      // The whole approve flow runs inside db.$transaction, so the proposal
      // read + status update happen on `tx`, not the top-level db mock.
      const tx = {
        proposal: {
          findUnique: vi.fn().mockResolvedValue({
            id: "p-1",
            type: "SUBJECT",
            status: "SUBMITTED",
            schoolId: "school-1",
            proposedBy: "teacher-1",
            data: { name: "Physics", department: "Science", grades: [1] },
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        subject: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "cs-1" }),
        },
        academicGrade: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ id: "grade-1", gradeNumber: 1 }]),
        },
        subjectSelection: {
          createMany: vi.fn().mockResolvedValue({}),
        },
      }
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) =>
        callback(tx)
      )
      vi.mocked(db.user.findFirst).mockResolvedValue({
        role: "TEACHER",
      } as any)

      const result = await approveProposal("p-1", "Looks good")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ catalogEntityId: "cs-1" })
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      expect(tx.subject.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Physics",
          department: "Science",
          status: "PUBLISHED",
        }),
      })
      // Opt-in flow: approval must NOT bridge the subject into the school —
      // the school adds it from the pinned catalog picker.
      expect(tx.subjectSelection.createMany).not.toHaveBeenCalled()
      expect(tx.academicGrade.findMany).not.toHaveBeenCalled()
      expect(tx.proposal.update).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: expect.objectContaining({
          status: "PUBLISHED",
          reviewedBy: "dev-1",
          catalogEntityId: "cs-1",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/proposals")
    })

    it("notifies proposer + school admins on approval", async () => {
      mockDeveloperSession()

      const tx = {
        proposal: {
          findUnique: vi.fn().mockResolvedValue({
            id: "p-1",
            type: "SUBJECT",
            status: "SUBMITTED",
            schoolId: "school-1",
            proposedBy: "teacher-1",
            data: { name: "Robotics", department: "STEM", grades: [10] },
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        subject: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "cs-2" }),
        },
      }
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) =>
        callback(tx)
      )
      // Proposer is a TEACHER → gets an individual notification on top of the
      // ADMIN audience dispatch.
      vi.mocked(db.user.findFirst).mockResolvedValue({
        role: "TEACHER",
      } as any)

      const result = await approveProposal("p-1")

      expect(result.success).toBe(true)
      expect(dispatchNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolId: "school-1",
          userId: "teacher-1",
          type: "document_shared",
          channels: ["in_app", "email"],
          metadata: expect.objectContaining({
            entityType: "proposal",
            entityId: "p-1",
            catalogEntityId: "cs-2",
            kind: "proposal_approved",
            url: "/subjects/catalog",
          }),
        })
      )
      expect(dispatchNotificationsToAudience).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolId: "school-1",
          targetScope: "role",
          targetRole: "ADMIN",
          type: "document_shared",
        })
      )
    })

    it("skips the individual dispatch when the proposer is an ADMIN (audience covers them)", async () => {
      mockDeveloperSession()

      const tx = {
        proposal: {
          findUnique: vi.fn().mockResolvedValue({
            id: "p-1",
            type: "SUBJECT",
            status: "SUBMITTED",
            schoolId: "school-1",
            proposedBy: "admin-1",
            data: { name: "Robotics" },
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        subject: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "cs-3" }),
        },
      }
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) =>
        callback(tx)
      )
      vi.mocked(db.user.findFirst).mockResolvedValue({ role: "ADMIN" } as any)

      const result = await approveProposal("p-1")

      expect(result.success).toBe(true)
      expect(dispatchNotification).not.toHaveBeenCalled()
      expect(dispatchNotificationsToAudience).toHaveBeenCalledTimes(1)
    })

    it("approval still succeeds when notification dispatch throws", async () => {
      mockDeveloperSession()

      const tx = {
        proposal: {
          findUnique: vi.fn().mockResolvedValue({
            id: "p-1",
            type: "SUBJECT",
            status: "SUBMITTED",
            schoolId: "school-1",
            proposedBy: "teacher-1",
            data: { name: "Robotics" },
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        subject: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "cs-4" }),
        },
      }
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) =>
        callback(tx)
      )
      vi.mocked(db.user.findFirst).mockRejectedValue(new Error("db down"))

      const result = await approveProposal("p-1")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ catalogEntityId: "cs-4" })
    })

    it("approves CHAPTER proposal", async () => {
      mockDeveloperSession()

      vi.mocked(db.proposal.findUnique).mockResolvedValue({
        id: "p-2",
        type: "CHAPTER",
        status: "IN_REVIEW",
        schoolId: "school-1",
        parentSubjectId: "cs-1",
        data: { name: "Mechanics", sequenceOrder: 1 },
      } as any)

      vi.mocked(db.chapter.findFirst).mockResolvedValue(null)
      vi.mocked(db.chapter.create).mockResolvedValue({
        id: "ch-1",
      } as any)
      // approveProposal flips the proposal status via tx.proposal.update (NOT
      // updateMany — only rejectProposal uses the CAS updateMany guard).
      vi.mocked(db.proposal.update).mockResolvedValue({} as any)

      const result = await approveProposal("p-2")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ catalogEntityId: "ch-1" })
      expect(db.chapter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subjectId: "cs-1",
          name: "Mechanics",
          status: "PUBLISHED",
        }),
      })
      expect(db.proposal.update).toHaveBeenCalledWith({
        where: { id: "p-2" },
        data: expect.objectContaining({ status: "PUBLISHED" }),
      })
    })

    it("approves LESSON proposal", async () => {
      mockDeveloperSession()

      vi.mocked(db.proposal.findUnique).mockResolvedValue({
        id: "p-3",
        type: "LESSON",
        status: "SUBMITTED",
        schoolId: "school-1",
        parentChapterId: "ch-1",
        data: { name: "Newton's Laws", durationMinutes: 45 },
      } as any)

      vi.mocked(db.lesson.findFirst).mockResolvedValue(null)
      vi.mocked(db.lesson.create).mockResolvedValue({
        id: "les-1",
      } as any)
      // approveProposal uses tx.proposal.update (not the CAS updateMany).
      vi.mocked(db.proposal.update).mockResolvedValue({} as any)

      const result = await approveProposal("p-3")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ catalogEntityId: "les-1" })
      expect(db.proposal.update).toHaveBeenCalledWith({
        where: { id: "p-3" },
        data: expect.objectContaining({ status: "PUBLISHED" }),
      })
      expect(db.lesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          chapterId: "ch-1",
          name: "Newton's Laws",
          durationMinutes: 45,
          status: "PUBLISHED",
        }),
      })
    })

    it("returns error for non-existent proposal", async () => {
      mockDeveloperSession()
      vi.mocked(db.proposal.findUnique).mockResolvedValue(null)

      const result = await approveProposal("nonexistent")

      expect(result).toEqual({ success: false, error: "proposal_not_found" })
    })

    it("returns error for already-approved proposal", async () => {
      mockDeveloperSession()
      vi.mocked(db.proposal.findUnique).mockResolvedValue({
        id: "p-1",
        type: "SUBJECT",
        status: "PUBLISHED",
        data: {},
      } as any)

      const result = await approveProposal("p-1")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Cannot approve a proposal with status")
    })

    it("returns error for unknown proposal type", async () => {
      mockDeveloperSession()
      vi.mocked(db.proposal.findUnique).mockResolvedValue({
        id: "p-1",
        type: "UNKNOWN",
        status: "SUBMITTED",
        data: {},
      } as any)

      const result = await approveProposal("p-1")

      expect(result).toEqual({
        success: false,
        error: "Unknown proposal type: UNKNOWN",
      })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await approveProposal("p-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.proposal.findUnique).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // rejectProposal
  // ==========================================================================

  describe("rejectProposal", () => {
    it("rejects proposal with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.proposal.findUnique).mockResolvedValue({
        status: "SUBMITTED",
        schoolId: "school-1",
        proposedBy: "teacher-1",
        data: { name: "Astrology" },
      } as any)
      vi.mocked(db.proposal.updateMany).mockResolvedValue({ count: 1 } as any)
      vi.mocked(db.user.findFirst).mockResolvedValue({
        role: "TEACHER",
      } as any)

      const result = await rejectProposal("p-1", "Duplicate subject")

      expect(result).toEqual({ success: true })
      expect(db.proposal.updateMany).toHaveBeenCalledWith({
        where: { id: "p-1", status: { in: ["SUBMITTED", "IN_REVIEW"] } },
        data: expect.objectContaining({
          status: "REJECTED",
          reviewedBy: "dev-1",
          rejectionReason: "Duplicate subject",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/proposals")
    })

    it("returns error when another reviewer already transitioned it (race lost)", async () => {
      mockDeveloperSession()
      vi.mocked(db.proposal.findUnique).mockResolvedValue({
        status: "SUBMITTED",
        schoolId: "school-1",
        proposedBy: "teacher-1",
        data: { name: "Astrology" },
      } as any)
      // CAS update matches zero rows — someone else already rejected/approved.
      vi.mocked(db.proposal.updateMany).mockResolvedValue({ count: 0 } as any)

      const result = await rejectProposal("p-1", "Duplicate subject")

      expect(result.success).toBe(false)
      expect(dispatchNotification).not.toHaveBeenCalled()
    })

    it("notifies proposer + school admins on rejection with the reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.proposal.findUnique).mockResolvedValue({
        status: "IN_REVIEW",
        schoolId: "school-1",
        proposedBy: "teacher-1",
        data: { name: "Astrology" },
      } as any)
      vi.mocked(db.proposal.updateMany).mockResolvedValue({ count: 1 } as any)
      vi.mocked(db.user.findFirst).mockResolvedValue({
        role: "TEACHER",
      } as any)

      const result = await rejectProposal("p-1", "Not curriculum-aligned")

      expect(result).toEqual({ success: true })
      expect(dispatchNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolId: "school-1",
          userId: "teacher-1",
          type: "system_alert",
          priority: "high",
          body: expect.stringContaining("Not curriculum-aligned"),
          metadata: expect.objectContaining({
            entityType: "proposal",
            entityId: "p-1",
            kind: "proposal_rejected",
            rejectionReason: "Not curriculum-aligned",
          }),
        })
      )
      expect(dispatchNotificationsToAudience).toHaveBeenCalledWith(
        expect.objectContaining({
          targetScope: "role",
          targetRole: "ADMIN",
          type: "system_alert",
        })
      )
    })

    it("rejection still succeeds when notification dispatch throws", async () => {
      mockDeveloperSession()
      vi.mocked(db.proposal.findUnique).mockResolvedValue({
        status: "SUBMITTED",
        schoolId: "school-1",
        proposedBy: "teacher-1",
        data: { name: "Astrology" },
      } as any)
      vi.mocked(db.proposal.updateMany).mockResolvedValue({ count: 1 } as any)
      vi.mocked(db.user.findFirst).mockRejectedValue(new Error("db down"))

      const result = await rejectProposal("p-1", "Some reason")

      expect(result).toEqual({ success: true })
    })

    it("returns error for empty rejection reason", async () => {
      mockDeveloperSession()

      const result = await rejectProposal("p-1", "")

      expect(result).toEqual({
        success: false,
        error: "rejection_reason_required",
      })
      expect(db.proposal.findUnique).not.toHaveBeenCalled()
    })

    it("returns error for whitespace-only rejection reason", async () => {
      mockDeveloperSession()

      const result = await rejectProposal("p-1", "   ")

      expect(result).toEqual({
        success: false,
        error: "rejection_reason_required",
      })
    })

    it("returns error for non-existent proposal", async () => {
      mockDeveloperSession()
      vi.mocked(db.proposal.findUnique).mockResolvedValue(null)

      const result = await rejectProposal("nonexistent", "Bad content")

      expect(result).toEqual({ success: false, error: "proposal_not_found" })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const result = await rejectProposal("p-1", "Some reason")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })
})
