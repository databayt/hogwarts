/**
 * Internal Onboarding Server Actions Tests
 *
 * Tests for:
 * - checkExistingApplication: Looks up ADMITTED application by schoolId + email
 * - submitInternalOnboarding: Creates User + role-specific records in a transaction
 */

import { revalidatePath } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { checkExistingApplication, submitInternalOnboarding } from "../actions"

// =============================================================================
// Mocks
// =============================================================================

vi.mock("@/lib/db", () => ({
  db: {
    application: { findFirst: vi.fn() },
    school: { findUnique: vi.fn() },
    user: { findFirst: vi.fn(), create: vi.fn() },
    teacher: { create: vi.fn() },
    teacherPhoneNumber: { create: vi.fn() },
    teacherQualification: { create: vi.fn() },
    staffMember: { create: vi.fn() },
    staffPhoneNumber: { create: vi.fn() },
    staffQualification: { create: vi.fn() },
    student: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// =============================================================================
// Test Data Factories
// =============================================================================

const createPersonalData = (overrides = {}) => ({
  givenName: "Ahmed",
  middleName: "Mohamed",
  surname: "Hassan",
  dateOfBirth: "2000-01-15",
  gender: "male",
  nationality: "Egyptian",
  profilePhotoUrl: "https://example.com/photo.jpg",
  ...overrides,
})

const createContactData = (overrides = {}) => ({
  email: "ahmed@example.com",
  emailVerified: true,
  phone: "0501234567",
  address: "123 Main St",
  city: "Riyadh",
  state: "Riyadh Region",
  country: "Saudi Arabia",
  emergencyContactName: "Fatima Hassan",
  emergencyContactPhone: "0509876543",
  emergencyContactRelation: "Mother",
  ...overrides,
})

const createTeacherDetails = (overrides = {}) => ({
  subjects: ["Mathematics", "Physics"],
  yearsOfExperience: 5,
  employmentType: "FULL_TIME",
  qualificationName: "PhD in Mathematics",
  qualificationInstitution: "MIT",
  qualificationYear: "2020",
  ...overrides,
})

const createStaffDetails = (overrides = {}) => ({
  departmentId: "dept-1",
  position: "Office Manager",
  employmentType: "FULL_TIME",
  qualificationName: "MBA",
  qualificationInstitution: "Harvard",
  qualificationYear: "2018",
  ...overrides,
})

const createAdminDetails = (overrides = {}) => ({
  departmentId: "dept-admin-1",
  position: "Principal",
  administrativeArea: "academic",
  ...overrides,
})

const createStudentDetails = (overrides = {}) => ({
  gradeLevel: "10",
  previousSchool: "Al-Azhar School",
  previousGrade: "9",
  studentType: "REGULAR",
  ...overrides,
})

// =============================================================================
// Shared Setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// checkExistingApplication Tests
// =============================================================================

describe("checkExistingApplication", () => {
  it("should return found: true with data when application exists", async () => {
    const mockApplication = {
      firstName: "Ahmed",
      middleName: "Mohamed",
      lastName: "Hassan",
      dateOfBirth: new Date("2000-01-15"),
      gender: "male",
      nationality: "Egyptian",
      photoUrl: "https://example.com/photo.jpg",
      email: "ahmed@example.com",
      phone: "0501234567",
      address: "123 Main St",
      city: "Riyadh",
      state: "Riyadh Region",
      country: "Saudi Arabia",
      applyingForClass: "10",
      previousSchool: "Old School",
      previousClass: "9",
      documents: [
        {
          type: "passport",
          name: "passport.pdf",
          url: "https://storage.example.com/passport.pdf",
          uploadedAt: "2024-01-15",
        },
      ],
    }

    vi.mocked(db.application.findFirst).mockResolvedValue(
      mockApplication as any
    )

    const result = await checkExistingApplication(
      "school-1",
      "ahmed@example.com"
    )

    expect(result.success).toBe(true)
    expect(result.found).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data?.firstName).toBe("Ahmed")
    expect(result.data?.lastName).toBe("Hassan")
    expect(result.data?.email).toBe("ahmed@example.com")
    expect(result.data?.dateOfBirth).toBe("2000-01-15")
    expect(result.data?.documents).toHaveLength(1)
  })

  it("should query with correct schoolId, email, and ADMITTED status", async () => {
    vi.mocked(db.application.findFirst).mockResolvedValue(null)

    await checkExistingApplication("school-1", "ahmed@example.com")

    expect(db.application.findFirst).toHaveBeenCalledWith({
      where: {
        schoolId: "school-1",
        email: "ahmed@example.com",
        status: "ADMITTED",
      },
      select: expect.objectContaining({
        firstName: true,
        lastName: true,
        email: true,
      }),
    })
  })

  it("should return found: false when no application exists", async () => {
    vi.mocked(db.application.findFirst).mockResolvedValue(null)

    const result = await checkExistingApplication(
      "school-1",
      "unknown@example.com"
    )

    expect(result.success).toBe(true)
    expect(result.found).toBe(false)
    expect(result.data).toBeUndefined()
  })

  it("should return error when schoolId is missing", async () => {
    const result = await checkExistingApplication("", "ahmed@example.com")

    expect(result.success).toBe(false)
    expect(result.found).toBe(false)
    expect(result.error).toBe("Missing required fields")
    expect(db.application.findFirst).not.toHaveBeenCalled()
  })

  it("should return error when email is missing", async () => {
    const result = await checkExistingApplication("school-1", "")

    expect(result.success).toBe(false)
    expect(result.found).toBe(false)
    expect(result.error).toBe("Missing required fields")
    expect(db.application.findFirst).not.toHaveBeenCalled()
  })

  it("should return error on database failure", async () => {
    vi.mocked(db.application.findFirst).mockRejectedValue(
      new Error("Database connection failed")
    )

    const result = await checkExistingApplication(
      "school-1",
      "ahmed@example.com"
    )

    expect(result.success).toBe(false)
    expect(result.found).toBe(false)
    expect(result.error).toBe("Failed to check existing application")
  })

  it("should handle application with null optional fields", async () => {
    const mockApplication = {
      firstName: "Ahmed",
      middleName: null,
      lastName: "Hassan",
      dateOfBirth: new Date("2000-01-15"),
      gender: "male",
      nationality: "Egyptian",
      photoUrl: null,
      email: "ahmed@example.com",
      phone: "0501234567",
      address: "123 Main St",
      city: "Riyadh",
      state: "Riyadh Region",
      country: "Saudi Arabia",
      applyingForClass: "10",
      previousSchool: null,
      previousClass: null,
      documents: null,
    }

    vi.mocked(db.application.findFirst).mockResolvedValue(
      mockApplication as any
    )

    const result = await checkExistingApplication(
      "school-1",
      "ahmed@example.com"
    )

    expect(result.success).toBe(true)
    expect(result.found).toBe(true)
    expect(result.data?.middleName).toBeUndefined()
    expect(result.data?.photoUrl).toBeUndefined()
    expect(result.data?.previousSchool).toBeUndefined()
    expect(result.data?.previousClass).toBeUndefined()
    expect(result.data?.documents).toBeUndefined()
  })
})

// =============================================================================
// submitInternalOnboarding Tests
// =============================================================================

describe("submitInternalOnboarding", () => {
  // Create a tx mock that mirrors db model mocks
  const createTxMock = () => ({
    user: { create: vi.fn() },
    teacher: { create: vi.fn() },
    teacherPhoneNumber: { create: vi.fn() },
    teacherQualification: { create: vi.fn() },
    staffMember: { create: vi.fn() },
    staffPhoneNumber: { create: vi.fn() },
    staffQualification: { create: vi.fn() },
    student: { create: vi.fn() },
  })

  const setupSuccessfulTransaction = (
    txMock: ReturnType<typeof createTxMock>
  ) => {
    vi.mocked(db.school.findUnique).mockResolvedValue({ id: "school-1" } as any)
    vi.mocked(db.user.findFirst).mockResolvedValue(null)
    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      return callback(txMock)
    })
  }

  // ---------------------------------------------------------------------------
  // Error Cases
  // ---------------------------------------------------------------------------

  describe("error handling", () => {
    it("should return error when schoolId is missing", async () => {
      const result = await submitInternalOnboarding("", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails(),
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Missing schoolId")
    })

    it("should return error when school is not found", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue(null)

      const result = await submitInternalOnboarding("nonexistent-school", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails(),
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("should return error when email is already registered", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue({
        id: "school-1",
      } as any)
      vi.mocked(db.user.findFirst).mockResolvedValue({
        id: "existing-user",
        email: "ahmed@example.com",
      } as any)

      const result = await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails(),
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        "This email is already registered at this school"
      )
    })

    it("should check email uniqueness scoped by schoolId", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue({
        id: "school-1",
      } as any)
      vi.mocked(db.user.findFirst).mockResolvedValue(null)
      vi.mocked(db.$transaction).mockRejectedValue(new Error("tx error"))

      await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData({ email: "test@example.com" }),
        roleDetails: createTeacherDetails(),
      })

      expect(db.user.findFirst).toHaveBeenCalledWith({
        where: { email: "test@example.com", schoolId: "school-1" },
      })
    })

    it("should return generic error on transaction failure", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue({
        id: "school-1",
      } as any)
      vi.mocked(db.user.findFirst).mockResolvedValue(null)
      vi.mocked(db.$transaction).mockRejectedValue(
        new Error("Transaction failed")
      )

      const result = await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails(),
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        "Failed to submit onboarding. Please try again."
      )
    })
  })

  // ---------------------------------------------------------------------------
  // Teacher Role
  // ---------------------------------------------------------------------------

  describe("teacher role", () => {
    it("should create user with TEACHER role", async () => {
      const txMock = createTxMock()
      const mockUser = { id: "user-teacher-1" }
      txMock.user.create.mockResolvedValue(mockUser)
      txMock.teacher.create.mockResolvedValue({ id: "teacher-1" })
      setupSuccessfulTransaction(txMock)

      const result = await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails(),
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        userId: "user-teacher-1",
        status: "pending_approval",
      })

      // Verify user created with correct role
      expect(txMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "ahmed@example.com",
          role: "TEACHER",
          schoolId: "school-1",
        }),
      })
    })

    it("should create teacher record with personal and contact data", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.teacher.create.mockResolvedValue({ id: "teacher-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails(),
      })

      expect(txMock.teacher.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          givenName: "Ahmed",
          surname: "Hassan",
          gender: "male",
          emailAddress: "ahmed@example.com",
          employmentType: "FULL_TIME",
          schoolId: "school-1",
        }),
      })
    })

    it("should create teacher phone number when phone is provided", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.teacher.create.mockResolvedValue({ id: "teacher-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData({ phone: "0501234567" }),
        roleDetails: createTeacherDetails(),
      })

      expect(txMock.teacherPhoneNumber.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          teacherId: "teacher-1",
          phoneNumber: "0501234567",
          phoneType: "mobile",
          isPrimary: true,
          schoolId: "school-1",
        }),
      })
    })

    it("should NOT create teacher phone number when phone is empty", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.teacher.create.mockResolvedValue({ id: "teacher-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData({ phone: "" }),
        roleDetails: createTeacherDetails(),
      })

      expect(txMock.teacherPhoneNumber.create).not.toHaveBeenCalled()
    })

    it("should create teacher qualification when qualificationName is provided", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.teacher.create.mockResolvedValue({ id: "teacher-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails({
          qualificationName: "PhD in Physics",
          qualificationInstitution: "Cambridge",
          qualificationYear: "2019",
        }),
      })

      expect(txMock.teacherQualification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          teacherId: "teacher-1",
          qualificationType: "DEGREE",
          name: "PhD in Physics",
          institution: "Cambridge",
          schoolId: "school-1",
        }),
      })
    })

    it("should NOT create teacher qualification when qualificationName is empty", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.teacher.create.mockResolvedValue({ id: "teacher-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails({ qualificationName: "" }),
      })

      expect(txMock.teacherQualification.create).not.toHaveBeenCalled()
    })

    it("should call revalidatePath after successful creation", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.teacher.create.mockResolvedValue({ id: "teacher-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails(),
      })

      expect(revalidatePath).toHaveBeenCalledWith("/admin/applications")
    })
  })

  // ---------------------------------------------------------------------------
  // Staff Role
  // ---------------------------------------------------------------------------

  describe("staff role", () => {
    it("should create user with STAFF role", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-staff-1" })
      txMock.staffMember.create.mockResolvedValue({ id: "staff-1" })
      setupSuccessfulTransaction(txMock)

      const result = await submitInternalOnboarding("school-1", {
        role: "staff",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createStaffDetails(),
      })

      expect(result.success).toBe(true)
      expect(result.data?.userId).toBe("user-staff-1")

      expect(txMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: "STAFF",
          schoolId: "school-1",
        }),
      })
    })

    it("should create staffMember record with all fields", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.staffMember.create.mockResolvedValue({ id: "staff-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "staff",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createStaffDetails({ position: "Receptionist" }),
      })

      expect(txMock.staffMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          givenName: "Ahmed",
          surname: "Hassan",
          gender: "male",
          emailAddress: "ahmed@example.com",
          position: "Receptionist",
          employmentType: "FULL_TIME",
          schoolId: "school-1",
        }),
      })
    })

    it("should create staff phone number when phone is provided", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.staffMember.create.mockResolvedValue({ id: "staff-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "staff",
        personal: createPersonalData(),
        contact: createContactData({ phone: "0501234567" }),
        roleDetails: createStaffDetails(),
      })

      expect(txMock.staffPhoneNumber.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          staffMemberId: "staff-1",
          phoneNumber: "0501234567",
          phoneType: "mobile",
          isPrimary: true,
          schoolId: "school-1",
        }),
      })
    })

    it("should NOT create staff phone number when phone is empty", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.staffMember.create.mockResolvedValue({ id: "staff-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "staff",
        personal: createPersonalData(),
        contact: createContactData({ phone: "" }),
        roleDetails: createStaffDetails(),
      })

      expect(txMock.staffPhoneNumber.create).not.toHaveBeenCalled()
    })

    it("should create staff qualification when qualificationName is provided", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.staffMember.create.mockResolvedValue({ id: "staff-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "staff",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createStaffDetails({ qualificationName: "MBA" }),
      })

      expect(txMock.staffQualification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          staffMemberId: "staff-1",
          qualificationType: "DEGREE",
          name: "MBA",
          schoolId: "school-1",
        }),
      })
    })

    it("should NOT create staff qualification when qualificationName is empty", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.staffMember.create.mockResolvedValue({ id: "staff-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "staff",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createStaffDetails({ qualificationName: "" }),
      })

      expect(txMock.staffQualification.create).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------
  // Admin Role
  // ---------------------------------------------------------------------------

  describe("admin role", () => {
    it("should create user with ADMIN role", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-admin-1" })
      txMock.staffMember.create.mockResolvedValue({ id: "staff-admin-1" })
      setupSuccessfulTransaction(txMock)

      const result = await submitInternalOnboarding("school-1", {
        role: "admin",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createAdminDetails(),
      })

      expect(result.success).toBe(true)
      expect(result.data?.userId).toBe("user-admin-1")

      expect(txMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: "ADMIN",
          schoolId: "school-1",
        }),
      })
    })

    it("should create staffMember record for admin role (shared with staff)", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.staffMember.create.mockResolvedValue({ id: "staff-admin-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "admin",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createAdminDetails({ position: "Vice Principal" }),
      })

      expect(txMock.staffMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          givenName: "Ahmed",
          surname: "Hassan",
          position: "Vice Principal",
          schoolId: "school-1",
        }),
      })
    })

    it("should use FULL_TIME as default employmentType for admin", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.staffMember.create.mockResolvedValue({ id: "staff-admin-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "admin",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createAdminDetails(),
      })

      expect(txMock.staffMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employmentType: "FULL_TIME",
        }),
      })
    })
  })

  // ---------------------------------------------------------------------------
  // Student Role
  // ---------------------------------------------------------------------------

  describe("student role", () => {
    it("should create user with STUDENT role", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-student-1" })
      txMock.student.create.mockResolvedValue({ id: "student-1" })
      setupSuccessfulTransaction(txMock)

      const result = await submitInternalOnboarding("school-1", {
        role: "student",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createStudentDetails(),
      })

      expect(result.success).toBe(true)
      expect(result.data?.userId).toBe("user-student-1")

      expect(txMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: "STUDENT",
          schoolId: "school-1",
        }),
      })
    })

    it("should create student record with all personal and contact data", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.student.create.mockResolvedValue({ id: "student-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "student",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createStudentDetails(),
      })

      expect(txMock.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          givenName: "Ahmed",
          middleName: "Mohamed",
          surname: "Hassan",
          gender: "male",
          nationality: "Egyptian",
          email: "ahmed@example.com",
          mobileNumber: "0501234567",
          currentAddress: "123 Main St",
          city: "Riyadh",
          state: "Riyadh Region",
          country: "Saudi Arabia",
          emergencyContactName: "Fatima Hassan",
          emergencyContactPhone: "0509876543",
          emergencyContactRelation: "Mother",
          previousSchoolName: "Al-Azhar School",
          previousGrade: "9",
          studentType: "REGULAR",
          schoolId: "school-1",
        }),
      })
    })

    it("should handle student with minimal optional data", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.student.create.mockResolvedValue({ id: "student-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "student",
        personal: createPersonalData({ middleName: "", nationality: "" }),
        contact: createContactData({
          phone: "",
          address: "",
          city: "",
          state: "",
          country: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          emergencyContactRelation: "",
        }),
        roleDetails: createStudentDetails({
          previousSchool: "",
          previousGrade: "",
        }),
      })

      expect(txMock.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          givenName: "Ahmed",
          surname: "Hassan",
          schoolId: "school-1",
        }),
      })
    })
  })

  // ---------------------------------------------------------------------------
  // User Creation Consistency
  // ---------------------------------------------------------------------------

  describe("user creation", () => {
    it("should set username as 'givenName surname'", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.teacher.create.mockResolvedValue({ id: "teacher-1" })
      setupSuccessfulTransaction(txMock)

      await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData({ givenName: "Khalid", surname: "Ali" }),
        contact: createContactData(),
        roleDetails: createTeacherDetails(),
      })

      expect(txMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: "Khalid Ali",
        }),
      })
    })

    it("should set emailVerified to current date", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-1" })
      txMock.teacher.create.mockResolvedValue({ id: "teacher-1" })
      setupSuccessfulTransaction(txMock)

      const beforeTime = new Date()
      await submitInternalOnboarding("school-1", {
        role: "teacher",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createTeacherDetails(),
      })
      const afterTime = new Date()

      const createCall = txMock.user.create.mock.calls[0][0]
      const emailVerified = createCall.data.emailVerified as Date
      expect(emailVerified.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      )
      expect(emailVerified.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it("should return success with userId and pending_approval status", async () => {
      const txMock = createTxMock()
      txMock.user.create.mockResolvedValue({ id: "user-abc-123" })
      txMock.student.create.mockResolvedValue({ id: "student-1" })
      setupSuccessfulTransaction(txMock)

      const result = await submitInternalOnboarding("school-1", {
        role: "student",
        personal: createPersonalData(),
        contact: createContactData(),
        roleDetails: createStudentDetails(),
      })

      expect(result).toEqual({
        success: true,
        data: {
          userId: "user-abc-123",
          status: "pending_approval",
        },
      })
    })
  })
})
