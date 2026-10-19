// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { updateAssignmentDetails } from "@/components/school-dashboard/listings/assignments/wizard/details/actions"

vi.mock("server-only", () => ({}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { schoolAssignment: { updateMany: vi.fn(async () => ({ count: 1 })) } },
}))

const input = {
  totalPoints: 100,
  weight: 10,
  dueDate: new Date("2026-10-26T12:00:00Z"),
  instructions: "x",
}

function signIn(role: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", role, schoolId: "school1" },
  } as never)
}

// Every wizard action checked sign-in only: a signed-in student could
// rewrite an assignment's points, due date and instructions.
describe("assignment wizard guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: "school1",
    } as never)
  })

  it("refuses a student", async () => {
    signIn("STUDENT")
    const res = await updateAssignmentDetails("a1", input)
    expect(res.success).toBe(false)
    expect(db.schoolAssignment.updateMany).not.toHaveBeenCalled()
  })

  it("lets a teacher edit, scoped to the school", async () => {
    signIn("TEACHER")
    const res = await updateAssignmentDetails("a1", input)
    expect(res.success).toBe(true)
    expect(db.schoolAssignment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "a1", schoolId: "school1" } })
    )
  })
})
