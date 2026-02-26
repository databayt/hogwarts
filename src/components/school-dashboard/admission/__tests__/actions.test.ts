// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  confirmEnrollment,
  createCampaign,
  deleteCampaign,
  fetchCampaignOptions,
  generateMeritList,
  getApplications,
  getAvailableClassesForPlacement,
  getCampaign,
  getCampaigns,
  getEnrollmentData,
  getMeritListData,
  placeStudentInClass,
  recordPayment,
  updateApplicationStatus,
  updateCampaign,
} from "../actions"
// Re-import mocked modules so we can control their return values
import {
  getApplicationsList,
  getCampaignOptions,
  getCampaignsList,
  getEnrollmentList,
  getMeritList,
} from "../queries"
import { campaignSchemaWithValidation } from "../validation"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    admissionCampaign: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    studentClass: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    yearLevel: {
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
      upsert: vi.fn(),
    },
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

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as any)
}

function mockNoSchoolId() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: null, role: "USER" },
  } as any)
}

const validCampaignData = {
  name: "Fall 2026 Admissions",
  academicYear: "2026-2027",
  startDate: new Date("2026-03-01"),
  endDate: new Date("2026-06-30"),
  status: "OPEN" as const,
  description: "Fall admission campaign",
  totalSeats: 100,
  applicationFee: 50,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Admission Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticated()
    vi.mocked(campaignSchemaWithValidation.safeParse).mockReturnValue({
      success: true,
      data: validCampaignData,
    } as any)
  })

  // =========================================================================
  // AUTH GUARD
  // =========================================================================

  describe("auth guard", () => {
    it("returns Unauthorized when session is null", async () => {
      mockUnauthenticated()

      const result = await getCampaigns({})

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized")
    })

    it("returns Unauthorized when schoolId is missing from session", async () => {
      mockNoSchoolId()

      const result = await createCampaign(validCampaignData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized")
    })

    it("returns Unauthorized for every action when not authenticated", async () => {
      mockUnauthenticated()

      const results = await Promise.all([
        getCampaigns({}),
        getCampaign({ id: "c-1" }),
        createCampaign(validCampaignData),
        updateCampaign({ ...validCampaignData, id: "c-1" }),
        deleteCampaign({ id: "c-1" }),
        getApplications({}),
        updateApplicationStatus({ id: "a-1", status: "SHORTLISTED" }),
        getMeritListData({}),
        generateMeritList({ campaignId: "c-1" }),
        getEnrollmentData({}),
        confirmEnrollment({ id: "a-1" }),
        recordPayment({ id: "a-1", paymentId: "pay-1" }),
        getAvailableClassesForPlacement({ applyingForClass: "Grade 1" }),
        placeStudentInClass({ applicationId: "a-1", classId: "cls-1" }),
        fetchCampaignOptions(),
      ])

      for (const result of results) {
        expect(result.success).toBe(false)
        expect(result.error).toBe("Unauthorized")
      }
    })
  })

  // =========================================================================
  // getCampaigns
  // =========================================================================

  describe("getCampaigns", () => {
    it("returns paginated campaigns from query function", async () => {
      const mockRows = [
        {
          id: "c-1",
          name: "Fall 2026",
          academicYear: "2026-2027",
          startDate: new Date("2026-03-01"),
          endDate: new Date("2026-06-30"),
          status: "OPEN",
          totalSeats: 100,
          applicationFee: { toString: () => "50" },
          createdAt: new Date("2026-01-01"),
          _count: { applications: 5 },
        },
      ]
      vi.mocked(getCampaignsList).mockResolvedValue({
        rows: mockRows as any,
        count: 1,
      })

      const result = await getCampaigns({ page: 1, perPage: 10 })

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(1)
      expect(result.data?.total).toBe(1)
      expect(result.data?.rows[0]).toMatchObject({
        id: "c-1",
        name: "Fall 2026",
        applicationsCount: 5,
      })
      expect(getCampaignsList).toHaveBeenCalledWith(SCHOOL_ID, {
        page: 1,
        perPage: 10,
      })
    })

    it("returns error when query throws", async () => {
      vi.mocked(getCampaignsList).mockRejectedValue(new Error("DB error"))

      const result = await getCampaigns({})

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to fetch campaigns")
    })
  })

  // =========================================================================
  // getCampaign
  // =========================================================================

  describe("getCampaign", () => {
    it("returns a single campaign by id scoped by schoolId", async () => {
      const mockCampaign = {
        id: "c-1",
        name: "Fall 2026",
        academicYear: "2026-2027",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-06-30"),
        status: "OPEN",
        description: "Test",
        totalSeats: 100,
        applicationFee: { toString: () => "50" },
      }
      vi.mocked(db.admissionCampaign.findUnique).mockResolvedValue(
        mockCampaign as any
      )

      const result = await getCampaign({ id: "c-1" })

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe("c-1")
      expect(result.data?.applicationFee).toBe("50")
      expect(db.admissionCampaign.findUnique).toHaveBeenCalledWith({
        where: { id: "c-1", schoolId: SCHOOL_ID },
      })
    })

    it("returns error when campaign not found", async () => {
      vi.mocked(db.admissionCampaign.findUnique).mockResolvedValue(null)

      const result = await getCampaign({ id: "nonexistent" })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Campaign not found")
    })
  })

  // =========================================================================
  // createCampaign
  // =========================================================================

  describe("createCampaign", () => {
    it("creates a campaign with validated data and schoolId", async () => {
      vi.mocked(db.admissionCampaign.create).mockResolvedValue({
        id: "c-new",
      } as any)

      const result = await createCampaign(validCampaignData)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe("c-new")
      expect(db.admissionCampaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          name: validCampaignData.name,
          academicYear: validCampaignData.academicYear,
          totalSeats: validCampaignData.totalSeats,
        }),
      })
    })

    it("returns validation error when schema fails", async () => {
      vi.mocked(campaignSchemaWithValidation.safeParse).mockReturnValue({
        success: false,
        error: { issues: [{ message: "Name must be at least 3 characters" }] },
      } as any)

      const result = await createCampaign({ ...validCampaignData, name: "AB" })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Name must be at least 3 characters")
    })

    it("returns P2002 unique constraint error as friendly message", async () => {
      vi.mocked(db.admissionCampaign.create).mockRejectedValue({
        code: "P2002",
      })

      const result = await createCampaign(validCampaignData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("A campaign with this name already exists")
    })

    it("returns generic error for unexpected exceptions", async () => {
      vi.mocked(db.admissionCampaign.create).mockRejectedValue(
        new Error("Connection lost")
      )

      const result = await createCampaign(validCampaignData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to create campaign")
    })
  })

  // =========================================================================
  // updateCampaign
  // =========================================================================

  describe("updateCampaign", () => {
    it("updates a campaign scoped by schoolId", async () => {
      vi.mocked(db.admissionCampaign.update).mockResolvedValue({} as any)

      const result = await updateCampaign({
        ...validCampaignData,
        id: "c-1",
      })

      expect(result.success).toBe(true)
      expect(db.admissionCampaign.update).toHaveBeenCalledWith({
        where: { id: "c-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({
          name: validCampaignData.name,
        }),
      })
    })

    it("returns validation error when schema fails", async () => {
      vi.mocked(campaignSchemaWithValidation.safeParse).mockReturnValue({
        success: false,
        error: { issues: [{ message: "End date must be after start date" }] },
      } as any)

      const result = await updateCampaign({
        ...validCampaignData,
        id: "c-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("End date must be after start date")
    })

    it("handles P2002 unique constraint on update", async () => {
      vi.mocked(db.admissionCampaign.update).mockRejectedValue({
        code: "P2002",
      })

      const result = await updateCampaign({
        ...validCampaignData,
        id: "c-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("A campaign with this name already exists")
    })
  })

  // =========================================================================
  // deleteCampaign
  // =========================================================================

  describe("deleteCampaign", () => {
    it("deletes a campaign with no applications", async () => {
      vi.mocked(db.admissionCampaign.findUnique).mockResolvedValue({
        id: "c-1",
        _count: { applications: 0 },
      } as any)
      vi.mocked(db.admissionCampaign.delete).mockResolvedValue({} as any)

      const result = await deleteCampaign({ id: "c-1" })

      expect(result.success).toBe(true)
      expect(db.admissionCampaign.delete).toHaveBeenCalledWith({
        where: { id: "c-1", schoolId: SCHOOL_ID },
      })
    })

    it("prevents deletion when campaign has applications", async () => {
      vi.mocked(db.admissionCampaign.findUnique).mockResolvedValue({
        id: "c-1",
        _count: { applications: 3 },
      } as any)

      const result = await deleteCampaign({ id: "c-1" })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        "Cannot delete campaign with existing applications"
      )
      expect(db.admissionCampaign.delete).not.toHaveBeenCalled()
    })

    it("returns error when campaign not found", async () => {
      vi.mocked(db.admissionCampaign.findUnique).mockResolvedValue(null)

      const result = await deleteCampaign({ id: "nonexistent" })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Campaign not found")
      expect(db.admissionCampaign.delete).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // getApplications
  // =========================================================================

  describe("getApplications", () => {
    it("returns paginated applications with mapped fields", async () => {
      const mockRows = [
        {
          id: "a-1",
          applicationNumber: "APP-001",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          applyingForClass: "Grade 5",
          status: "UNDER_REVIEW",
          meritScore: { toString: () => "85.5" },
          meritRank: 1,
          submittedAt: new Date("2026-02-01"),
          createdAt: new Date("2026-01-15"),
          campaign: { id: "c-1", name: "Fall 2026" },
        },
      ]
      vi.mocked(getApplicationsList).mockResolvedValue({
        rows: mockRows as any,
        count: 1,
      })

      const result = await getApplications({ campaignId: "c-1" })

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(1)
      expect(result.data?.rows[0]).toMatchObject({
        id: "a-1",
        applicantName: "John Doe",
        meritScore: "85.5",
        campaignName: "Fall 2026",
      })
    })
  })

  // =========================================================================
  // updateApplicationStatus
  // =========================================================================

  describe("updateApplicationStatus", () => {
    it("updates the application status with reviewer info", async () => {
      vi.mocked(db.application.update).mockResolvedValue({} as any)

      const result = await updateApplicationStatus({
        id: "a-1",
        status: "SHORTLISTED",
      })

      expect(result.success).toBe(true)
      expect(db.application.update).toHaveBeenCalledWith({
        where: { id: "a-1", schoolId: SCHOOL_ID },
        data: {
          status: "SHORTLISTED",
          reviewedAt: expect.any(Date),
          reviewedBy: USER_ID,
        },
      })
    })

    it("returns error when update fails", async () => {
      vi.mocked(db.application.update).mockRejectedValue(
        new Error("Record not found")
      )

      const result = await updateApplicationStatus({
        id: "a-missing",
        status: "REJECTED",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to update status")
    })
  })

  // =========================================================================
  // getMeritListData
  // =========================================================================

  describe("getMeritListData", () => {
    it("returns merit list with scores", async () => {
      const mockRows = [
        {
          id: "a-1",
          applicationNumber: "APP-001",
          firstName: "Alice",
          lastName: "Smith",
          applyingForClass: "Grade 10",
          category: "GENERAL",
          status: "SELECTED",
          meritScore: { toString: () => "92.0" },
          meritRank: 1,
          entranceScore: { toString: () => "88" },
          interviewScore: { toString: () => "96" },
          campaign: { id: "c-1", name: "Fall 2026" },
        },
      ]
      vi.mocked(getMeritList).mockResolvedValue({
        rows: mockRows as any,
        count: 1,
      })

      const result = await getMeritListData({ campaignId: "c-1" })

      expect(result.success).toBe(true)
      expect(result.data?.rows[0]).toMatchObject({
        meritScore: "92.0",
        meritRank: 1,
        entranceScore: "88",
        interviewScore: "96",
      })
    })
  })

  // =========================================================================
  // generateMeritList
  // =========================================================================

  describe("generateMeritList", () => {
    it("ranks eligible applications by score descending", async () => {
      const mockApplications = [
        { id: "a-1", meritScore: 95 },
        { id: "a-2", meritScore: 88 },
        { id: "a-3", meritScore: 92 },
      ]
      vi.mocked(db.application.findMany).mockResolvedValue(
        mockApplications as any
      )
      vi.mocked(db.application.update).mockResolvedValue({} as any)

      const result = await generateMeritList({ campaignId: "c-1" })

      expect(result.success).toBe(true)
      expect(db.application.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: SCHOOL_ID,
          campaignId: "c-1",
          status: { in: ["SHORTLISTED", "SELECTED", "WAITLISTED"] },
        },
        orderBy: [
          { meritScore: "desc" },
          { entranceScore: "desc" },
          { interviewScore: "desc" },
        ],
      })
      // Each application gets a merit rank (1-indexed)
      expect(db.application.update).toHaveBeenCalledTimes(3)
      expect(db.application.update).toHaveBeenNthCalledWith(1, {
        where: { id: "a-1" },
        data: { meritRank: 1 },
      })
      expect(db.application.update).toHaveBeenNthCalledWith(2, {
        where: { id: "a-2" },
        data: { meritRank: 2 },
      })
      expect(db.application.update).toHaveBeenNthCalledWith(3, {
        where: { id: "a-3" },
        data: { meritRank: 3 },
      })
    })

    it("handles empty application list gracefully", async () => {
      vi.mocked(db.application.findMany).mockResolvedValue([])

      const result = await generateMeritList({ campaignId: "c-empty" })

      expect(result.success).toBe(true)
      expect(db.application.update).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // getEnrollmentData
  // =========================================================================

  describe("getEnrollmentData", () => {
    it("returns enrollment rows with document status", async () => {
      const mockRows = [
        {
          id: "a-1",
          applicationNumber: "APP-001",
          firstName: "Bob",
          lastName: "Jones",
          applyingForClass: "Grade 3",
          status: "ADMITTED",
          meritRank: 2,
          admissionOffered: true,
          offerDate: new Date("2026-04-01"),
          offerExpiryDate: new Date("2026-04-15"),
          admissionConfirmed: true,
          confirmationDate: new Date("2026-04-05"),
          applicationFeePaid: true,
          paymentDate: new Date("2026-04-06"),
          documents: ["doc1.pdf", "doc2.pdf"],
          campaign: { id: "c-1", name: "Fall 2026" },
        },
      ]
      vi.mocked(getEnrollmentList).mockResolvedValue({
        rows: mockRows as any,
        count: 1,
      })

      const result = await getEnrollmentData({})

      expect(result.success).toBe(true)
      expect(result.data?.rows[0]).toMatchObject({
        id: "a-1",
        admissionConfirmed: true,
        applicationFeePaid: true,
        hasDocuments: true,
      })
    })

    it("sets hasDocuments to false when documents is null", async () => {
      const mockRows = [
        {
          id: "a-2",
          applicationNumber: "APP-002",
          firstName: "Eve",
          lastName: "Park",
          applyingForClass: "Grade 1",
          status: "SELECTED",
          meritRank: 5,
          admissionOffered: false,
          offerDate: null,
          offerExpiryDate: null,
          admissionConfirmed: false,
          confirmationDate: null,
          applicationFeePaid: false,
          paymentDate: null,
          documents: null,
          campaign: { id: "c-1", name: "Fall 2026" },
        },
      ]
      vi.mocked(getEnrollmentList).mockResolvedValue({
        rows: mockRows as any,
        count: 1,
      })

      const result = await getEnrollmentData({})

      expect(result.success).toBe(true)
      expect(result.data?.rows[0]).toMatchObject({ hasDocuments: false })
    })
  })

  // =========================================================================
  // confirmEnrollment
  // =========================================================================

  describe("confirmEnrollment", () => {
    const mockApplication = {
      id: "a-1",
      schoolId: SCHOOL_ID,
      userId: "user-applicant",
      firstName: "John",
      middleName: "M",
      lastName: "Doe",
      dateOfBirth: new Date("2010-05-15"),
      gender: "MALE",
      nationality: "US",
      email: "john@example.com",
      phone: "+1234567890",
      address: "123 Main St",
      city: "Anytown",
      state: "CA",
      postalCode: "12345",
      country: "US",
      category: "GENERAL",
      previousSchool: "Old School",
      previousClass: "Grade 4",
      applyingForClass: "Grade 5",
      campaign: { academicYear: "2026-2027" },
    }

    it("confirms enrollment and creates student record", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue(
        mockApplication as any
      )
      vi.mocked(db.application.update).mockResolvedValue({} as any)
      vi.mocked(db.student.findUnique).mockResolvedValue(null)
      vi.mocked(db.student.create).mockResolvedValue({
        id: "student-new",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue(null)
      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "USER",
      } as any)
      vi.mocked(db.user.update).mockResolvedValue({} as any)
      vi.mocked(db.feeStructure.findMany).mockResolvedValue([])

      const result = await confirmEnrollment({ id: "a-1" })

      expect(result.success).toBe(true)
      // Verify application status set to ADMITTED
      expect(db.application.update).toHaveBeenCalledWith({
        where: { id: "a-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({
          status: "ADMITTED",
          admissionConfirmed: true,
          confirmationDate: expect.any(Date),
          enrollmentNumber: expect.stringContaining("ENR-"),
        }),
      })
      // Verify student created with schoolId
      expect(db.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          userId: "user-applicant",
          givenName: "John",
          surname: "Doe",
          email: "john@example.com",
          status: "ACTIVE",
        }),
      })
      // Verify user role promoted to STUDENT
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-applicant" },
        data: { role: "STUDENT" },
      })
    })

    it("returns error when application not found", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue(null)

      const result = await confirmEnrollment({ id: "nonexistent" })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Application not found")
    })

    it("reuses existing student record instead of creating a new one", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue(
        mockApplication as any
      )
      vi.mocked(db.application.update).mockResolvedValue({} as any)
      vi.mocked(db.student.findUnique).mockResolvedValue({
        id: "student-existing",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue(null)
      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "STUDENT",
      } as any)
      vi.mocked(db.feeStructure.findMany).mockResolvedValue([])

      const result = await confirmEnrollment({ id: "a-1" })

      expect(result.success).toBe(true)
      // Student should NOT be created again
      expect(db.student.create).not.toHaveBeenCalled()
      // User role should NOT be updated (already STUDENT)
      expect(db.user.update).not.toHaveBeenCalled()
    })

    it("returns error when student belongs to another school", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue(
        mockApplication as any
      )
      vi.mocked(db.application.update).mockResolvedValue({} as any)
      vi.mocked(db.student.findUnique).mockResolvedValue({
        id: "student-other",
        schoolId: "other-school-999",
      } as any)

      const result = await confirmEnrollment({ id: "a-1" })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Student is already enrolled in another school")
    })

    it("creates StudentYearLevel when matching YearLevel and SchoolYear exist", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue(
        mockApplication as any
      )
      vi.mocked(db.application.update).mockResolvedValue({} as any)
      vi.mocked(db.student.findUnique).mockResolvedValue(null)
      vi.mocked(db.student.create).mockResolvedValue({
        id: "student-new",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue({
        id: "yl-5",
        levelName: "Grade 5",
      } as any)
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "sy-2026",
        yearName: "2026-2027",
      } as any)
      vi.mocked(db.studentYearLevel.upsert).mockResolvedValue({} as any)
      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "USER",
      } as any)
      vi.mocked(db.user.update).mockResolvedValue({} as any)
      vi.mocked(db.feeStructure.findMany).mockResolvedValue([])

      const result = await confirmEnrollment({ id: "a-1" })

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
          levelId: "yl-5",
          yearId: "sy-2026",
        },
        update: {
          levelId: "yl-5",
        },
      })
    })

    it("auto-assigns fee structures upon enrollment", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue(
        mockApplication as any
      )
      vi.mocked(db.application.update).mockResolvedValue({} as any)
      vi.mocked(db.student.findUnique).mockResolvedValue(null)
      vi.mocked(db.student.create).mockResolvedValue({
        id: "student-new",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.yearLevel.findFirst).mockResolvedValue(null)
      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "USER",
      } as any)
      vi.mocked(db.user.update).mockResolvedValue({} as any)
      vi.mocked(db.feeStructure.findMany).mockResolvedValue([
        { id: "fs-1", totalAmount: 5000, academicYear: "2026-2027" },
        { id: "fs-2", totalAmount: 1000, academicYear: "2026-2027" },
      ] as any)
      vi.mocked(db.feeAssignment.upsert).mockResolvedValue({} as any)

      const result = await confirmEnrollment({ id: "a-1" })

      expect(result.success).toBe(true)
      expect(db.feeAssignment.upsert).toHaveBeenCalledTimes(2)
      expect(db.feeAssignment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            schoolId: SCHOOL_ID,
            studentId: "student-new",
            feeStructureId: "fs-1",
            finalAmount: 5000,
            status: "PENDING",
          }),
        })
      )
    })

    it("skips student creation when userId is null", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue({
        ...mockApplication,
        userId: null,
      } as any)
      vi.mocked(db.application.update).mockResolvedValue({} as any)

      const result = await confirmEnrollment({ id: "a-1" })

      expect(result.success).toBe(true)
      expect(db.student.create).not.toHaveBeenCalled()
      expect(db.student.findUnique).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // recordPayment
  // =========================================================================

  describe("recordPayment", () => {
    it("marks application as paid with payment reference", async () => {
      vi.mocked(db.application.update).mockResolvedValue({} as any)

      const result = await recordPayment({
        id: "a-1",
        paymentId: "pay-stripe-123",
      })

      expect(result.success).toBe(true)
      expect(db.application.update).toHaveBeenCalledWith({
        where: { id: "a-1", schoolId: SCHOOL_ID },
        data: {
          applicationFeePaid: true,
          paymentId: "pay-stripe-123",
          paymentDate: expect.any(Date),
        },
      })
    })

    it("returns error on database failure", async () => {
      vi.mocked(db.application.update).mockRejectedValue(
        new Error("DB timeout")
      )

      const result = await recordPayment({ id: "a-1", paymentId: "pay-1" })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to record payment")
    })
  })

  // =========================================================================
  // getAvailableClassesForPlacement
  // =========================================================================

  describe("getAvailableClassesForPlacement", () => {
    it("returns classes with enrollment counts", async () => {
      vi.mocked(db.class.findMany).mockResolvedValue([
        {
          id: "cls-1",
          name: "5A",
          maxCapacity: 30,
          _count: { studentClasses: 25 },
        },
        {
          id: "cls-2",
          name: "5B",
          maxCapacity: null,
          _count: { studentClasses: 10 },
        },
      ] as any)

      const result = await getAvailableClassesForPlacement({
        applyingForClass: "Grade 5",
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toEqual({
        id: "cls-1",
        name: "5A",
        enrolledStudents: 25,
        maxCapacity: 30,
      })
      // Default maxCapacity of 50 when null
      expect(result.data?.[1].maxCapacity).toBe(50)
    })
  })

  // =========================================================================
  // placeStudentInClass
  // =========================================================================

  describe("placeStudentInClass", () => {
    const setupPlacementMocks = () => {
      vi.mocked(db.application.findUnique).mockResolvedValue({
        status: "ADMITTED",
        userId: "user-student",
        firstName: "Jane",
        lastName: "Doe",
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
      } as any)
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "cls-1",
        name: "5A",
        maxCapacity: 30,
        _count: { studentClasses: 20 },
      } as any)
      vi.mocked(db.studentClass.findFirst).mockResolvedValue(null)
      vi.mocked(db.studentClass.create).mockResolvedValue({} as any)
    }

    it("places student in class successfully", async () => {
      setupPlacementMocks()

      const result = await placeStudentInClass({
        applicationId: "a-1",
        classId: "cls-1",
      })

      expect(result.success).toBe(true)
      expect(db.studentClass.create).toHaveBeenCalledWith({
        data: {
          schoolId: SCHOOL_ID,
          studentId: "student-1",
          classId: "cls-1",
        },
      })
    })

    it("rejects placement for non-ADMITTED application", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue({
        status: "UNDER_REVIEW",
        userId: "user-student",
        firstName: "Jane",
        lastName: "Doe",
      } as any)

      const result = await placeStudentInClass({
        applicationId: "a-1",
        classId: "cls-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        "Only admitted students can be placed in classes"
      )
    })

    it("rejects placement when no user account linked", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue({
        status: "ADMITTED",
        userId: null,
        firstName: "Jane",
        lastName: "Doe",
      } as any)

      const result = await placeStudentInClass({
        applicationId: "a-1",
        classId: "cls-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("No user account linked to this application")
    })

    it("rejects placement when student record not found", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue({
        status: "ADMITTED",
        userId: "user-student",
        firstName: "Jane",
        lastName: "Doe",
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await placeStudentInClass({
        applicationId: "a-1",
        classId: "cls-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        "Student record not found. Ensure enrollment is confirmed first."
      )
    })

    it("rejects placement when class is at full capacity", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue({
        status: "ADMITTED",
        userId: "user-student",
        firstName: "Jane",
        lastName: "Doe",
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
      } as any)
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "cls-1",
        name: "5A",
        maxCapacity: 30,
        _count: { studentClasses: 30 },
      } as any)

      const result = await placeStudentInClass({
        applicationId: "a-1",
        classId: "cls-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Class "5A" is at full capacity (30/30)')
    })

    it("rejects duplicate enrollment in the same class", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue({
        status: "ADMITTED",
        userId: "user-student",
        firstName: "Jane",
        lastName: "Doe",
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
      } as any)
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "cls-1",
        name: "5A",
        maxCapacity: 30,
        _count: { studentClasses: 20 },
      } as any)
      vi.mocked(db.studentClass.findFirst).mockResolvedValue({
        id: "existing-enrollment",
      } as any)

      const result = await placeStudentInClass({
        applicationId: "a-1",
        classId: "cls-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Jane Doe is already enrolled in "5A"')
    })

    it("returns error when application not found", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue(null)

      const result = await placeStudentInClass({
        applicationId: "nonexistent",
        classId: "cls-1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Application not found")
    })

    it("returns error when class not found", async () => {
      vi.mocked(db.application.findUnique).mockResolvedValue({
        status: "ADMITTED",
        userId: "user-student",
        firstName: "Jane",
        lastName: "Doe",
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
      } as any)
      vi.mocked(db.class.findFirst).mockResolvedValue(null)

      const result = await placeStudentInClass({
        applicationId: "a-1",
        classId: "nonexistent",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Class not found")
    })
  })

  // =========================================================================
  // fetchCampaignOptions
  // =========================================================================

  describe("fetchCampaignOptions", () => {
    it("returns campaign options for dropdown", async () => {
      vi.mocked(getCampaignOptions).mockResolvedValue([
        { value: "c-1", label: "Fall 2026 (2026-2027)" },
        { value: "c-2", label: "Spring 2027 (2026-2027)" },
      ])

      const result = await fetchCampaignOptions()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toEqual({
        value: "c-1",
        label: "Fall 2026 (2026-2027)",
      })
      expect(getCampaignOptions).toHaveBeenCalledWith(SCHOOL_ID)
    })

    it("returns error when query throws", async () => {
      vi.mocked(getCampaignOptions).mockRejectedValue(new Error("DB error"))

      const result = await fetchCampaignOptions()

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to fetch campaign options")
    })
  })
})
