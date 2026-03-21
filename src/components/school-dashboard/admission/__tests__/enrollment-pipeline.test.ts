// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { createInvoiceFromEnrollment } from "@/components/school-dashboard/finance/invoice/actions"

import { confirmEnrollment } from "../actions"
import { getCampaignsList } from "../queries"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    admissionCampaign: {
      findUnique: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    section: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    studentClass: {
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    yearLevel: {
      findFirst: vi.fn(),
    },
    academicGrade: {
      findFirst: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
    },
    studentYearLevel: {
      upsert: vi.fn(),
    },
    feeStructure: {
      findMany: vi.fn(),
    },
    feeAssignment: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    guardianType: {
      upsert: vi.fn(),
    },
    guardian: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    studentGuardian: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    guardianPhoneNumber: {
      upsert: vi.fn(),
    },
    studentDocument: {
      create: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("../queries", () => ({
  getCampaignsList: vi.fn(),
  getCampaignOptions: vi.fn(),
  getApplicationsList: vi.fn(),
  getMeritList: vi.fn(),
  getEnrollmentList: vi.fn(),
}))

vi.mock("../validation", () => ({
  campaignSchemaWithValidation: {
    safeParse: vi.fn(),
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockReturnValue(Promise.resolve("notif-1")),
}))

vi.mock("@/lib/enrollment-sync", () => ({
  enrollStudentInGradeClasses: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/grade-utils", () => ({
  extractGradeNumber: vi.fn().mockReturnValue(null),
}))

vi.mock("@/components/school-dashboard/finance/invoice/actions", () => ({
  createInvoiceFromEnrollment: vi.fn().mockResolvedValue({
    success: true,
    invoiceId: "inv-auto-1",
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"
const USER_ID = "user-1"

function mockAuthenticated() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role: "ADMIN" },
  } as any)
}

const mockApplication = {
  id: "app-1",
  schoolId: SCHOOL_ID,
  campaignId: "camp-1",
  userId: "user-1",
  firstName: "Ahmed",
  middleName: null,
  lastName: "Hassan",
  dateOfBirth: new Date("2010-05-15"),
  gender: "MALE",
  nationality: "Sudan",
  email: "ahmed@test.com",
  phone: "+249123456789",
  alternatePhone: null,
  address: "123 St",
  city: "Khartoum",
  state: "Khartoum",
  postalCode: "11111",
  country: "SD",
  fatherName: "Hassan Ahmed",
  fatherEmail: "hassan@test.com",
  fatherPhone: "+249111111111",
  fatherOccupation: "Engineer",
  motherName: "Fatima Ali",
  motherEmail: "fatima@test.com",
  motherPhone: "+249222222222",
  motherOccupation: "Teacher",
  guardianName: null,
  guardianEmail: null,
  guardianPhone: null,
  guardianRelation: null,
  guardianOccupation: null,
  applyingForClass: "Grade 1",
  status: "SELECTED",
  documents: null,
  previousSchool: null,
  previousClass: null,
  previousMarks: null,
  previousPercentage: null,
  achievements: null,
  category: null,
  photoUrl: null,
  campaign: { academicYear: "2026-2027" },
}

/**
 * Set up default mocks for a successful enrollment pipeline.
 * Individual tests can override specific mocks after calling this.
 */
function setupDefaultMocks() {
  mockAuthenticated()
  vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb(db))
  vi.mocked(db.application.findUnique).mockResolvedValue(mockApplication as any)
  vi.mocked(db.application.update).mockResolvedValue({} as any)
  vi.mocked(db.student.findUnique).mockResolvedValue(null)
  vi.mocked(db.student.create).mockResolvedValue({
    id: "student-new",
    schoolId: SCHOOL_ID,
  } as any)
  vi.mocked(db.student.update).mockResolvedValue({} as any)
  vi.mocked(db.yearLevel.findFirst).mockResolvedValue(null)
  vi.mocked(db.academicGrade.findFirst).mockResolvedValue(null)
  vi.mocked(db.user.findUnique).mockResolvedValue({ role: "USER" } as any)
  vi.mocked(db.user.findFirst).mockResolvedValue(null) // No existing user by email (for guest flow)
  vi.mocked(db.user.update).mockResolvedValue({} as any)
  vi.mocked(db.feeStructure.findMany).mockResolvedValue([])
  vi.mocked(db.feeAssignment.findMany).mockResolvedValue([])
  vi.mocked(db.guardianType.upsert).mockResolvedValue({ id: "gt-1" } as any)
  vi.mocked(db.guardian.upsert).mockResolvedValue({ id: "g-1" } as any)
  vi.mocked(db.guardian.create).mockResolvedValue({ id: "g-2" } as any)
  vi.mocked(db.studentGuardian.findMany).mockResolvedValue([])
  vi.mocked(db.studentGuardian.upsert).mockResolvedValue({} as any)
  vi.mocked(db.guardianPhoneNumber.upsert).mockResolvedValue({} as any)
  vi.mocked(db.studentDocument.create).mockResolvedValue({} as any)
  vi.mocked(db.section.findMany).mockResolvedValue([])
  vi.mocked(db.school.findFirst).mockResolvedValue({
    preferredLanguage: "ar",
  } as any)
  vi.mocked(db.school.findUnique).mockResolvedValue({
    name: "Test School",
    address: "123 Main St",
    currency: "USD",
  } as any)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("confirmEnrollment - full pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
  })

  // =========================================================================
  // Student record creation
  // =========================================================================

  it("creates student record from application data", async () => {
    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.student.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: SCHOOL_ID,
        givenName: "Ahmed",
        surname: "Hassan",
        dateOfBirth: mockApplication.dateOfBirth,
        gender: "MALE",
        nationality: "Sudan",
        email: "ahmed@test.com",
        mobileNumber: "+249123456789",
        currentAddress: "123 St",
        city: "Khartoum",
        state: "Khartoum",
        postalCode: "11111",
        country: "SD",
        applicationId: "app-1",
        status: "ACTIVE",
        emergencyContactName: "Hassan Ahmed",
        emergencyContactPhone: "+249111111111",
        emergencyContactRelation: "Parent",
        wizardStep: null,
      }),
    })
  })

  // =========================================================================
  // StudentYearLevel linking
  // =========================================================================

  it("creates StudentYearLevel linking student to grade", async () => {
    vi.mocked(db.yearLevel.findFirst).mockResolvedValue({
      id: "yl-1",
      levelName: "Grade 1",
    } as any)
    vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
      id: "sy-2026",
      yearName: "2026-2027",
    } as any)
    vi.mocked(db.studentYearLevel.upsert).mockResolvedValue({} as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.studentYearLevel.upsert).toHaveBeenCalledWith({
      where: {
        schoolId_studentId_yearId: {
          schoolId: SCHOOL_ID,
          studentId: "student-new",
          yearId: "sy-2026",
        },
      },
      create: {
        schoolId: SCHOOL_ID,
        studentId: "student-new",
        levelId: "yl-1",
        yearId: "sy-2026",
      },
      update: {
        levelId: "yl-1",
      },
    })
  })

  // =========================================================================
  // User role upgrade
  // =========================================================================

  it("upgrades user role to STUDENT when current role is USER", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "USER",
      schoolId: null,
    } as any)
    vi.mocked(db.user.update).mockResolvedValue({} as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { role: "STUDENT", schoolId: SCHOOL_ID },
      })
    )
  })

  it("does not downgrade user role when already STUDENT", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "STUDENT",
      schoolId: SCHOOL_ID,
    } as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    // user.update is called for the application status, but NOT for role change
    // We check that user.update was not called with role: "STUDENT"
    const userUpdateCalls = vi.mocked(db.user.update).mock.calls
    const roleUpdateCall = userUpdateCalls.find(
      (call) => (call[0] as any)?.data?.role === "STUDENT"
    )
    expect(roleUpdateCall).toBeUndefined()
  })

  // =========================================================================
  // Fee assignments
  // =========================================================================

  it("creates fee assignments from active fee structures", async () => {
    vi.mocked(db.feeStructure.findMany).mockResolvedValue([
      { id: "fs-1", totalAmount: 5000, academicYear: "2026-2027" },
      { id: "fs-2", totalAmount: 1000, academicYear: "2026-2027" },
    ] as any)
    vi.mocked(db.feeAssignment.upsert).mockResolvedValue({} as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.feeAssignment.upsert).toHaveBeenCalledTimes(2)
    expect(db.feeAssignment.upsert).toHaveBeenCalledWith({
      where: {
        studentId_feeStructureId_academicYear: {
          studentId: "student-new",
          feeStructureId: "fs-1",
          academicYear: "2026-2027",
        },
      },
      create: {
        schoolId: SCHOOL_ID,
        studentId: "student-new",
        feeStructureId: "fs-1",
        academicYear: "2026-2027",
        finalAmount: 5000,
        status: "PENDING",
      },
      update: {},
    })
  })

  // =========================================================================
  // Invoice generation
  // =========================================================================

  it("calls createInvoiceFromEnrollment with fee items", async () => {
    vi.mocked(db.feeStructure.findMany).mockResolvedValue([
      { id: "fs-1", totalAmount: 5000, academicYear: "2026-2027" },
    ] as any)
    vi.mocked(db.feeAssignment.upsert).mockResolvedValue({} as any)

    // After the transaction, confirmEnrollment queries feeAssignment.findMany
    vi.mocked(db.feeAssignment.findMany).mockResolvedValue([
      {
        id: "fa-1",
        finalAmount: 5000,
        status: "PENDING",
        feeStructure: { name: "Tuition Fee" },
      },
    ] as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(createInvoiceFromEnrollment).toHaveBeenCalledWith({
      schoolId: SCHOOL_ID,
      userId: "user-1",
      studentName: "Ahmed Hassan",
      studentEmail: "ahmed@test.com",
      schoolName: "Test School",
      schoolAddress: "123 Main St",
      currency: "USD",
      items: [{ name: "Tuition Fee", amount: 5000 }],
    })
  })

  it("succeeds even when invoice generation fails", async () => {
    vi.mocked(db.feeAssignment.findMany).mockResolvedValue([
      {
        id: "fa-1",
        finalAmount: 5000,
        status: "PENDING",
        feeStructure: { name: "Tuition Fee" },
      },
    ] as any)
    vi.mocked(createInvoiceFromEnrollment).mockRejectedValue(
      new Error("Invoice system down")
    )

    const result = await confirmEnrollment({ id: "app-1" })

    // Enrollment should still succeed - invoice failure is non-fatal
    expect(result.success).toBe(true)
  })

  // =========================================================================
  // Guardian records
  // =========================================================================

  it("creates guardian records from application parent data", async () => {
    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)

    // Father guardian type upsert
    expect(db.guardianType.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId_name: { schoolId: SCHOOL_ID, name: "father" },
        },
        create: { schoolId: SCHOOL_ID, name: "father" },
      })
    )

    // Mother guardian type upsert
    expect(db.guardianType.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId_name: { schoolId: SCHOOL_ID, name: "mother" },
        },
        create: { schoolId: SCHOOL_ID, name: "mother" },
      })
    )

    // Father guardian upsert (has email)
    expect(db.guardian.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId_emailAddress: {
            schoolId: SCHOOL_ID,
            emailAddress: "hassan@test.com",
          },
        },
        create: expect.objectContaining({
          schoolId: SCHOOL_ID,
          givenName: "Hassan",
          surname: "Ahmed",
          emailAddress: "hassan@test.com",
        }),
      })
    )

    // StudentGuardian links created
    expect(db.studentGuardian.upsert).toHaveBeenCalledTimes(2)

    // Phone numbers
    expect(db.guardianPhoneNumber.upsert).toHaveBeenCalledTimes(2)
  })

  // =========================================================================
  // Section suggestion
  // =========================================================================

  it("suggests section when exactly one has capacity", async () => {
    vi.mocked(db.section.findMany).mockResolvedValue([
      { id: "sec-1", name: "1A", maxCapacity: 30, _count: { students: 20 } },
    ] as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      suggestedSectionId: "sec-1",
      suggestedSectionName: "1A",
    })
  })

  it("does not suggest section when multiple have capacity", async () => {
    vi.mocked(db.section.findMany).mockResolvedValue([
      { id: "sec-1", name: "1A", maxCapacity: 30, _count: { students: 20 } },
      { id: "sec-2", name: "1B", maxCapacity: 30, _count: { students: 15 } },
    ] as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(result.data?.suggestedSectionId).toBeNull()
    expect(result.data?.suggestedSectionName).toBeNull()
  })

  it("does not suggest section when none have capacity", async () => {
    vi.mocked(db.section.findMany).mockResolvedValue([
      { id: "sec-1", name: "1A", maxCapacity: 30, _count: { students: 30 } },
    ] as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(result.data?.suggestedSectionId).toBeNull()
  })

  // =========================================================================
  // Application status update
  // =========================================================================

  it("updates application status to ADMITTED inside transaction", async () => {
    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    // The first call to application.update should set status to ADMITTED
    expect(db.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "app-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({
          status: "ADMITTED",
          admissionConfirmed: true,
          confirmationDate: expect.any(Date),
          enrollmentNumber: expect.stringContaining("ENR-"),
        }),
      })
    )
  })

  // =========================================================================
  // Guest user creation
  // =========================================================================

  it("creates guest user for applications without userId", async () => {
    vi.mocked(db.application.findUnique).mockResolvedValue({
      ...mockApplication,
      userId: null,
    } as any)
    vi.mocked(db.user.create).mockResolvedValue({
      id: "guest-user-1",
    } as any)
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "STUDENT",
    } as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "ahmed@test.com",
        username: "Ahmed Hassan",
        role: "STUDENT",
        schoolId: SCHOOL_ID,
        emailVerified: expect.any(Date),
      }),
    })
  })

  // =========================================================================
  // Document copy
  // =========================================================================

  it("copies application documents to StudentDocument records", async () => {
    vi.mocked(db.application.findUnique).mockResolvedValue({
      ...mockApplication,
      documents: [
        {
          type: "birth_cert",
          name: "Birth Certificate",
          url: "https://cdn.test/cert.pdf",
        },
        { type: "photo", name: "Photo", url: "https://cdn.test/photo.jpg" },
      ],
    } as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.studentDocument.create).toHaveBeenCalledTimes(2)
    expect(db.studentDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: SCHOOL_ID,
        studentId: "student-new",
        documentType: "birth_cert",
        documentName: "Birth Certificate",
        fileUrl: "https://cdn.test/cert.pdf",
      }),
    })
  })

  it("skips documents with no url", async () => {
    vi.mocked(db.application.findUnique).mockResolvedValue({
      ...mockApplication,
      documents: [
        { type: "birth_cert", name: "Birth Certificate", url: null },
        { type: "photo", name: "Photo", url: "https://cdn.test/photo.jpg" },
      ],
    } as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.studentDocument.create).toHaveBeenCalledTimes(1)
  })
})
