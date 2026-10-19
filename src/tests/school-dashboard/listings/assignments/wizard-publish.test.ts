// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { notifyAssignmentPublished } from "@/components/school-dashboard/listings/assignments/notify"
import { completeAssignmentWizard } from "@/components/school-dashboard/listings/assignments/wizard/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/refresh-page", () => ({ refreshPage: vi.fn() }))
vi.mock("next/server", async (orig) => ({
  ...(await orig<typeof import("next/server")>()),
  after: vi.fn((cb: () => unknown) => {
    void cb()
  }),
}))
vi.mock("@/components/school-dashboard/listings/assignments/notify", () => ({
  notifyAssignmentPublished: vi.fn(async () => ({ created: 0 })),
}))
vi.mock("@/lib/db", () => ({
  db: {
    schoolAssignment: { findFirst: vi.fn(), updateMany: vi.fn() },
  },
}))

function signIn(role: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", role, schoolId: "school1" },
  } as never)
}

// Finishing the wizard cleared its step and left the row DRAFT; students'
// lists hide drafts and nothing else on the web set PUBLISHED, so homework
// built in the wizard reached no student.
describe("completeAssignmentWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: "school1",
    } as never)
    vi.mocked(db.schoolAssignment.updateMany).mockResolvedValue({ count: 1 })
  })

  it("publishes a draft and tells its students", async () => {
    signIn("TEACHER")
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue({
      title: "Fractions",
      gradeId: "g1",
      status: "DRAFT",
    } as never)

    const res = await completeAssignmentWizard("a1")

    expect(res.success).toBe(true)
    expect(db.schoolAssignment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          wizardStep: null,
          status: "PUBLISHED",
          publishDate: expect.any(Date),
        }),
      })
    )
    expect(notifyAssignmentPublished).toHaveBeenCalledWith("school1", "a1")
  })

  it("re-finishing an already published assignment does not notify again", async () => {
    signIn("TEACHER")
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue({
      title: "Fractions",
      gradeId: "g1",
      status: "PUBLISHED",
    } as never)

    await completeAssignmentWizard("a1")

    expect(db.schoolAssignment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { wizardStep: null } })
    )
    expect(notifyAssignmentPublished).not.toHaveBeenCalled()
  })

  it("refuses a student", async () => {
    signIn("STUDENT")
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue({
      title: "Fractions",
      gradeId: "g1",
      status: "DRAFT",
    } as never)

    const res = await completeAssignmentWizard("a1")

    expect(res.success).toBe(false)
    expect(db.schoolAssignment.updateMany).not.toHaveBeenCalled()
  })
})
