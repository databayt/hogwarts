// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `provisionStudent` on an EXISTING student row.
 *
 * The admin wizard is also the edit surface for enrolled students, and its
 * final "Save" reached the core with only `existingStudentId`. The core then
 * treated the row like a fresh draft: it minted a new student code (while the
 * login username stayed put), minted a new shadow Application and re-pointed
 * `Student.applicationId` at it — orphaning the real PORTAL application for a
 * student who had applied through the portal — and re-stamped the dates.
 *
 * These tests pin the contract: what the row already carries is reused.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { provisionStudent } from "@/lib/student-provisioning"
import { generateStudentUsername } from "@/lib/student-username"
import { ensureDirectAdmitApplication } from "@/lib/system-campaign"

vi.mock("@/lib/credentials", () => ({
  mintTempPassword: vi
    .fn()
    .mockResolvedValue({ plain: "temp-1234", hashed: "hashed" }),
}))
vi.mock("@/lib/enrollment-sync", () => ({
  enrollStudentInGradeClasses: vi.fn().mockResolvedValue({ classIds: [] }),
}))
vi.mock("@/lib/fee-auto-assign", () => ({
  ensureStudentFeeAssignments: vi.fn().mockResolvedValue({
    created: 0,
    existing: 1,
    skipped: 0,
    assignmentIds: ["fa-1"],
    warnings: [],
  }),
}))
vi.mock("@/lib/guardian-utils", () => ({
  createOrLinkGuardian: vi.fn().mockResolvedValue({
    guardianId: "g-1",
    guardianTypeId: "gt-1",
    studentGuardianId: "sg-1",
    credentials: null,
  }),
}))
vi.mock("@/lib/student-username", () => ({
  generateStudentUsername: vi.fn().mockResolvedValue("26030042"),
}))
vi.mock("@/lib/system-campaign", () => ({
  ensureDirectAdmitApplication: vi.fn().mockResolvedValue("app-shadow-new"),
}))

const SCHOOL_ID = "school-1"

function makeTx(priorStudent: Record<string, unknown> | null) {
  const student = {
    findUnique: vi.fn().mockImplementation(({ where }: { where: unknown }) => {
      const w = where as { id?: string; userId?: string }
      if (w.id) return Promise.resolve(priorStudent)
      return Promise.resolve(null)
    }),
    update: vi.fn().mockResolvedValue({ id: "stu-1", schoolId: SCHOOL_ID }),
    create: vi.fn().mockResolvedValue({ id: "stu-new", schoolId: SCHOOL_ID }),
  }
  return {
    student,
    academicGrade: { findFirst: vi.fn().mockResolvedValue(null) },
    user: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue({
        role: "STUDENT",
        schoolId: SCHOOL_ID,
      }),
      create: vi.fn().mockResolvedValue({ id: "user-new" }),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    application: { update: vi.fn().mockResolvedValue({}) },
    yearLevel: { findFirst: vi.fn().mockResolvedValue(null) },
    schoolYear: { findFirst: vi.fn().mockResolvedValue(null) },
    studentYearLevel: { upsert: vi.fn() },
    section: { findFirst: vi.fn().mockResolvedValue(null) },
    studentDocument: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    },
  }
}

const baseInput = {
  schoolId: SCHOOL_ID,
  firstName: "Amal",
  lastName: "Hassan",
}

describe("provisionStudent — existing student rows", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("reuses the student code, application and user of an already-provisioned student", async () => {
    const tx = makeTx({
      id: "stu-1",
      schoolId: SCHOOL_ID,
      studentId: "26030001",
      applicationId: "app-portal-1",
      userId: "user-1",
    })

    const result = await provisionStudent(
      { ...baseInput, existingStudentId: "stu-1" },
      { notify: false, credentialDelivery: "none", origin: "ADMIN_DIRECT" },
      tx as never
    )

    expect(result.studentId).toBe("stu-1")
    expect(result.userId).toBe("user-1")
    expect(result.applicationId).toBe("app-portal-1")
    expect(result.isNewUser).toBe(false)
    // No second code, no second shadow Application, no new User.
    expect(generateStudentUsername).not.toHaveBeenCalled()
    expect(ensureDirectAdmitApplication).not.toHaveBeenCalled()
    expect(tx.user.create).not.toHaveBeenCalled()
    // The row keeps pointing at its ORIGINAL application.
    const update = tx.student.update.mock.calls[0]?.[0] as {
      data: { applicationId: string; studentId: string }
    }
    expect(update.data.applicationId).toBe("app-portal-1")
    expect(update.data.studentId).toBe("26030001")
  })

  it("still mints a code, a user and a shadow application for a wizard draft", async () => {
    const tx = makeTx({
      id: "stu-1",
      schoolId: SCHOOL_ID,
      studentId: null,
      applicationId: null,
      userId: null,
    })

    const result = await provisionStudent(
      { ...baseInput, existingStudentId: "stu-1" },
      {
        notify: false,
        credentialDelivery: "temp-password",
        origin: "ADMIN_DIRECT",
      },
      tx as never
    )

    expect(generateStudentUsername).toHaveBeenCalledTimes(1)
    expect(ensureDirectAdmitApplication).toHaveBeenCalledTimes(1)
    expect(tx.user.create).toHaveBeenCalledTimes(1)
    expect(result.isNewUser).toBe(true)
    expect(result.applicationId).toBe("app-shadow-new")
    expect(result.credentials).toEqual({
      username: "26030042",
      password: "temp-1234",
    })
  })

  it("refuses a student that belongs to another school", async () => {
    const tx = makeTx({
      id: "stu-1",
      schoolId: "other-school",
      studentId: "1",
      applicationId: null,
      userId: null,
    })

    await expect(
      provisionStudent(
        { ...baseInput, existingStudentId: "stu-1" },
        { notify: false, credentialDelivery: "none", origin: "ADMIN_DIRECT" },
        tx as never
      )
    ).rejects.toThrow(/another school/)
  })
})
