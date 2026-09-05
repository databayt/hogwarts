// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * completeStudentWizard — the wizard is both the CREATE and the EDIT surface
 * for a student. Only a draft (a row that still carries a `wizardStep`) may
 * go through the provisioning core; every other row — built by the core or
 * predating it — must short-circuit, or an ordinary Update would re-stamp the
 * student's status and dates, mint a second shadow Application and re-send
 * the "your account was created" notice.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { provisionStudent } from "@/lib/student-provisioning"
import { notifyProvisionedStudent } from "@/lib/student-provisioning-notify"
import { completeStudentWizard } from "@/components/school-dashboard/listings/students/wizard/actions"
import { authorizeWizardAction } from "@/components/school-dashboard/listings/students/wizard/authorize"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/server", () => ({ after: vi.fn((cb: () => unknown) => cb()) }))

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    studentGuardian: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/student-provisioning", () => ({
  provisionStudent: vi.fn(),
}))

vi.mock("@/lib/student-provisioning-notify", () => ({
  notifyProvisionedStudent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock(
  "@/components/school-dashboard/listings/students/wizard/authorize",
  () => ({ authorizeWizardAction: vi.fn() })
)

const SCHOOL_ID = "school-1"

const baseRow = {
  firstName: "علي",
  middleName: null,
  lastName: "الحسن",
  email: null,
  studentId: "25010007",
  academicGradeId: "grade-1",
  sectionId: null,
  dateOfBirth: new Date("2015-03-01"),
  gender: "male",
  nationality: null,
  mobileNumber: "0912345678",
  alternatePhone: null,
  currentAddress: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
  profilePhotoUrl: null,
  previousSchoolName: null,
  previousGrade: null,
  lang: "ar",
}

describe("completeStudentWizard — edit mode never re-provisions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authorizeWizardAction).mockResolvedValue({
      ok: true,
      schoolId: SCHOOL_ID,
      authContext: {} as never,
    } as never)
    vi.mocked(db.studentGuardian.count).mockResolvedValue(1)
    vi.mocked(db.$transaction).mockImplementation(async (fn: unknown) =>
      (fn as (tx: unknown) => Promise<unknown>)({})
    )
    vi.mocked(provisionStudent).mockResolvedValue({
      studentId: "stu-1",
      userId: "user-new",
      applicationId: "app-shadow",
      isNewUser: true,
      credentials: { username: "25010007", password: "temp" },
      warnings: [],
    } as never)
  })

  it("short-circuits a legacy student that has a login but no application row", async () => {
    // The common pre-unification shape: enrolled before the core existed,
    // so `applicationId` is null. Update must be a plain save.
    vi.mocked(db.student.findFirst).mockResolvedValue({
      ...baseRow,
      userId: "user-1",
      applicationId: null,
      wizardStep: null,
    } as never)

    const result = await completeStudentWizard("stu-1")

    expect(result.success).toBe(true)
    expect(result.success && result.data.credentials).toBeNull()
    expect(provisionStudent).not.toHaveBeenCalled()
    expect(db.$transaction).not.toHaveBeenCalled()
    expect(notifyProvisionedStudent).not.toHaveBeenCalled()
  })

  it("short-circuits a legacy student with neither a login nor an application", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      ...baseRow,
      userId: null,
      applicationId: null,
      wizardStep: null,
    } as never)

    const result = await completeStudentWizard("stu-1")

    expect(result.success).toBe(true)
    expect(provisionStudent).not.toHaveBeenCalled()
    expect(notifyProvisionedStudent).not.toHaveBeenCalled()
  })

  it("lets an enrolled student save edits even when no parent link is found", async () => {
    // The parent gate protects provisioning. An enrolled student whose parents
    // sit under a type name the gate does not know (or has none on file) must
    // still be able to leave the wizard via Update.
    vi.mocked(db.studentGuardian.count).mockResolvedValue(0)
    vi.mocked(db.student.findFirst).mockResolvedValue({
      ...baseRow,
      userId: "user-1",
      applicationId: null,
      wizardStep: null,
    } as never)

    const result = await completeStudentWizard("stu-1")

    expect(result.success).toBe(true)
    expect(provisionStudent).not.toHaveBeenCalled()
  })

  it("counts parents under every stored spelling of father/mother", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      ...baseRow,
      userId: null,
      applicationId: null,
      wizardStep: 4,
    } as never)

    await completeStudentWizard("stu-1")

    expect(db.studentGuardian.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          guardianType: {
            name: { in: expect.arrayContaining(["father", "mother", "الأب", "الأم"]) },
          },
        }),
      })
    )
  })

  it("short-circuits a student the core already provisioned", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      ...baseRow,
      userId: "user-1",
      applicationId: "app-portal-1",
      wizardStep: null,
    } as never)

    const result = await completeStudentWizard("stu-1")

    expect(result.success).toBe(true)
    expect(result.success && result.data.name).toBe("علي الحسن")
    expect(result.success && result.data.phone).toBe("0912345678")
    expect(provisionStudent).not.toHaveBeenCalled()
    expect(notifyProvisionedStudent).not.toHaveBeenCalled()
  })

  it("runs a draft through the core, reusing its existing application and user", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      ...baseRow,
      userId: null,
      applicationId: null,
      wizardStep: 4,
    } as never)

    const result = await completeStudentWizard("stu-1")

    expect(result.success).toBe(true)
    expect(provisionStudent).toHaveBeenCalledTimes(1)
    const [input, opts] = vi.mocked(provisionStudent).mock.calls[0]
    expect(input).toMatchObject({
      existingStudentId: "stu-1",
      schoolId: SCHOOL_ID,
      userId: null,
      applicationId: null,
    })
    expect(opts).toMatchObject({
      origin: "ADMIN_DIRECT",
      credentialDelivery: "temp-password",
    })
    expect(notifyProvisionedStudent).toHaveBeenCalledTimes(1)
    expect(notifyProvisionedStudent).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: SCHOOL_ID,
        studentId: "stu-1",
        userId: "user-new",
        origin: "ADMIN_DIRECT",
        isNewUser: true,
        delivery: "immediate",
      })
    )
    expect(result.success && result.data.credentials).toEqual({
      username: "25010007",
      password: "temp",
    })
  })

  it("refuses a draft that is missing a parent", async () => {
    vi.mocked(db.studentGuardian.count).mockResolvedValue(0)
    vi.mocked(db.student.findFirst).mockResolvedValue({
      ...baseRow,
      userId: null,
      applicationId: null,
      wizardStep: 4,
    } as never)

    const result = await completeStudentWizard("stu-1")

    expect(result.success).toBe(false)
    expect(provisionStudent).not.toHaveBeenCalled()
  })
})
