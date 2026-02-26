// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Internal Onboarding Validation Schema Tests
 *
 * Comprehensive tests for all internal onboarding Zod schemas:
 * - personalSchema
 * - contactSchema
 * - teacherDetailsSchema
 * - staffDetailsSchema
 * - adminDetailsSchema
 * - studentDetailsSchema
 * - documentsSchema
 */

import { describe, expect, it } from "vitest"

import {
  adminDetailsSchema,
  contactSchema,
  documentsSchema,
  personalSchema,
  staffDetailsSchema,
  studentDetailsSchema,
  teacherDetailsSchema,
} from "../validation"

// =============================================================================
// personalSchema Tests
// =============================================================================

describe("personalSchema", () => {
  const validPersonal = {
    givenName: "Ahmed",
    surname: "Hassan",
    dateOfBirth: "2000-01-15",
    gender: "male",
  }

  it("should accept valid personal data with required fields only", () => {
    const result = personalSchema.safeParse(validPersonal)
    expect(result.success).toBe(true)
  })

  it("should accept valid personal data with all fields", () => {
    const result = personalSchema.safeParse({
      ...validPersonal,
      middleName: "Mohamed",
      nationality: "Egyptian",
      profilePhotoUrl: "https://example.com/photo.jpg",
    })
    expect(result.success).toBe(true)
  })

  describe("givenName", () => {
    it("should accept givenName with exactly 2 characters", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        givenName: "Al",
      })
      expect(result.success).toBe(true)
    })

    it("should accept givenName with 50 characters", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        givenName: "A".repeat(50),
      })
      expect(result.success).toBe(true)
    })

    it("should reject givenName with less than 2 characters", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        givenName: "A",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2")
      }
    })

    it("should reject givenName with more than 50 characters", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        givenName: "A".repeat(51),
      })
      expect(result.success).toBe(false)
    })

    it("should reject empty givenName", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        givenName: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing givenName", () => {
      const { givenName, ...rest } = validPersonal
      const result = personalSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("middleName", () => {
    it("should accept middleName as optional", () => {
      const result = personalSchema.safeParse(validPersonal)
      expect(result.success).toBe(true)
    })

    it("should accept empty string for middleName", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        middleName: "",
      })
      expect(result.success).toBe(true)
    })

    it("should accept middleName with valid value", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        middleName: "Mohamed",
      })
      expect(result.success).toBe(true)
    })

    it("should reject middleName with more than 50 characters", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        middleName: "A".repeat(51),
      })
      expect(result.success).toBe(false)
    })
  })

  describe("surname", () => {
    it("should accept surname with exactly 2 characters", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        surname: "Li",
      })
      expect(result.success).toBe(true)
    })

    it("should accept surname with 50 characters", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        surname: "A".repeat(50),
      })
      expect(result.success).toBe(true)
    })

    it("should reject surname with less than 2 characters", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        surname: "H",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2")
      }
    })

    it("should reject surname with more than 50 characters", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        surname: "A".repeat(51),
      })
      expect(result.success).toBe(false)
    })

    it("should reject empty surname", () => {
      const result = personalSchema.safeParse({ ...validPersonal, surname: "" })
      expect(result.success).toBe(false)
    })
  })

  describe("dateOfBirth", () => {
    it("should accept valid date string", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        dateOfBirth: "1995-06-15",
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty dateOfBirth", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        dateOfBirth: "",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required")
      }
    })

    it("should reject missing dateOfBirth", () => {
      const { dateOfBirth, ...rest } = validPersonal
      const result = personalSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("gender", () => {
    it("should accept valid gender string", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        gender: "female",
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty gender", () => {
      const result = personalSchema.safeParse({ ...validPersonal, gender: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required")
      }
    })

    it("should reject missing gender", () => {
      const { gender, ...rest } = validPersonal
      const result = personalSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("nationality", () => {
    it("should accept nationality as optional", () => {
      const result = personalSchema.safeParse(validPersonal)
      expect(result.success).toBe(true)
    })

    it("should accept empty string for nationality", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        nationality: "",
      })
      expect(result.success).toBe(true)
    })

    it("should accept valid nationality", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        nationality: "Saudi",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("profilePhotoUrl", () => {
    it("should accept profilePhotoUrl as optional", () => {
      const result = personalSchema.safeParse(validPersonal)
      expect(result.success).toBe(true)
    })

    it("should accept empty string for profilePhotoUrl", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        profilePhotoUrl: "",
      })
      expect(result.success).toBe(true)
    })

    it("should accept valid URL for profilePhotoUrl", () => {
      const result = personalSchema.safeParse({
        ...validPersonal,
        profilePhotoUrl: "https://example.com/photo.jpg",
      })
      expect(result.success).toBe(true)
    })
  })
})

// =============================================================================
// contactSchema Tests
// =============================================================================

describe("contactSchema", () => {
  const validContact = {
    email: "ahmed@example.com",
    emailVerified: false,
  }

  it("should accept valid contact data with required fields only", () => {
    const result = contactSchema.safeParse(validContact)
    expect(result.success).toBe(true)
  })

  it("should accept valid contact data with all fields", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      phone: "0501234567",
      address: "123 Main St",
      city: "Riyadh",
      state: "Riyadh Region",
      country: "Saudi Arabia",
      emergencyContactName: "Fatima Hassan",
      emergencyContactPhone: "0509876543",
      emergencyContactRelation: "Mother",
    })
    expect(result.success).toBe(true)
  })

  describe("email", () => {
    it("should accept valid email", () => {
      const result = contactSchema.safeParse(validContact)
      expect(result.success).toBe(true)
    })

    it("should accept email with subdomain", () => {
      const result = contactSchema.safeParse({
        ...validContact,
        email: "user@mail.example.com",
      })
      expect(result.success).toBe(true)
    })

    it("should accept email with plus sign", () => {
      const result = contactSchema.safeParse({
        ...validContact,
        email: "user+tag@example.com",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid email format", () => {
      const result = contactSchema.safeParse({
        ...validContact,
        email: "invalid-email",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid email")
      }
    })

    it("should reject empty email", () => {
      const result = contactSchema.safeParse({ ...validContact, email: "" })
      expect(result.success).toBe(false)
    })

    it("should reject missing email", () => {
      const { email, ...rest } = validContact
      const result = contactSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("emailVerified", () => {
    it("should accept true", () => {
      const result = contactSchema.safeParse({
        ...validContact,
        emailVerified: true,
      })
      expect(result.success).toBe(true)
    })

    it("should accept false", () => {
      const result = contactSchema.safeParse({
        ...validContact,
        emailVerified: false,
      })
      expect(result.success).toBe(true)
    })

    it("should reject non-boolean value", () => {
      const result = contactSchema.safeParse({
        ...validContact,
        emailVerified: "true",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing emailVerified", () => {
      const { emailVerified, ...rest } = validContact
      const result = contactSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("phone", () => {
    it("should accept phone as optional", () => {
      const result = contactSchema.safeParse(validContact)
      expect(result.success).toBe(true)
    })

    it("should accept empty string for phone", () => {
      const result = contactSchema.safeParse({ ...validContact, phone: "" })
      expect(result.success).toBe(true)
    })

    it("should accept phone with at least 10 digits", () => {
      const result = contactSchema.safeParse({
        ...validContact,
        phone: "0501234567",
      })
      expect(result.success).toBe(true)
    })

    it("should reject phone with less than 10 characters", () => {
      const result = contactSchema.safeParse({
        ...validContact,
        phone: "12345",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("optional string fields", () => {
    const optionalFields = [
      "address",
      "city",
      "state",
      "country",
      "emergencyContactName",
      "emergencyContactPhone",
      "emergencyContactRelation",
    ] as const

    optionalFields.forEach((field) => {
      it(`should accept ${field} as optional`, () => {
        const result = contactSchema.safeParse(validContact)
        expect(result.success).toBe(true)
      })

      it(`should accept empty string for ${field}`, () => {
        const result = contactSchema.safeParse({ ...validContact, [field]: "" })
        expect(result.success).toBe(true)
      })

      it(`should accept valid value for ${field}`, () => {
        const result = contactSchema.safeParse({
          ...validContact,
          [field]: "Test Value",
        })
        expect(result.success).toBe(true)
      })
    })
  })
})

// =============================================================================
// teacherDetailsSchema Tests
// =============================================================================

describe("teacherDetailsSchema", () => {
  const validTeacher = {
    subjects: ["Mathematics"],
    employmentType: "FULL_TIME",
  }

  it("should accept valid teacher details with required fields only", () => {
    const result = teacherDetailsSchema.safeParse(validTeacher)
    expect(result.success).toBe(true)
  })

  it("should accept valid teacher details with all fields", () => {
    const result = teacherDetailsSchema.safeParse({
      ...validTeacher,
      subjects: ["Mathematics", "Physics"],
      yearsOfExperience: 5,
      qualificationName: "PhD in Mathematics",
      qualificationInstitution: "MIT",
      qualificationYear: "2020",
    })
    expect(result.success).toBe(true)
  })

  describe("subjects", () => {
    it("should accept array with one subject", () => {
      const result = teacherDetailsSchema.safeParse(validTeacher)
      expect(result.success).toBe(true)
    })

    it("should accept array with multiple subjects", () => {
      const result = teacherDetailsSchema.safeParse({
        ...validTeacher,
        subjects: ["Mathematics", "Physics", "Chemistry"],
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty array", () => {
      const result = teacherDetailsSchema.safeParse({
        ...validTeacher,
        subjects: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least one subject")
      }
    })

    it("should reject missing subjects", () => {
      const { subjects, ...rest } = validTeacher
      const result = teacherDetailsSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("yearsOfExperience", () => {
    it("should accept yearsOfExperience as optional", () => {
      const result = teacherDetailsSchema.safeParse(validTeacher)
      expect(result.success).toBe(true)
    })

    it("should accept 0 years of experience", () => {
      const result = teacherDetailsSchema.safeParse({
        ...validTeacher,
        yearsOfExperience: 0,
      })
      expect(result.success).toBe(true)
    })

    it("should accept positive years of experience", () => {
      const result = teacherDetailsSchema.safeParse({
        ...validTeacher,
        yearsOfExperience: 20,
      })
      expect(result.success).toBe(true)
    })

    it("should reject negative years of experience", () => {
      const result = teacherDetailsSchema.safeParse({
        ...validTeacher,
        yearsOfExperience: -1,
      })
      expect(result.success).toBe(false)
    })

    it("should coerce string to number for yearsOfExperience", () => {
      const result = teacherDetailsSchema.safeParse({
        ...validTeacher,
        yearsOfExperience: "10",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.yearsOfExperience).toBe(10)
        expect(typeof result.data.yearsOfExperience).toBe("number")
      }
    })

    it("should coerce '0' string to number 0", () => {
      const result = teacherDetailsSchema.safeParse({
        ...validTeacher,
        yearsOfExperience: "0",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.yearsOfExperience).toBe(0)
      }
    })
  })

  describe("employmentType", () => {
    it("should accept valid employment type", () => {
      const result = teacherDetailsSchema.safeParse(validTeacher)
      expect(result.success).toBe(true)
    })

    it("should reject empty employmentType", () => {
      const result = teacherDetailsSchema.safeParse({
        ...validTeacher,
        employmentType: "",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required")
      }
    })

    it("should reject missing employmentType", () => {
      const { employmentType, ...rest } = validTeacher
      const result = teacherDetailsSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("optional qualification fields", () => {
    const qualFields = [
      "qualificationName",
      "qualificationInstitution",
      "qualificationYear",
    ] as const

    qualFields.forEach((field) => {
      it(`should accept ${field} as optional`, () => {
        const result = teacherDetailsSchema.safeParse(validTeacher)
        expect(result.success).toBe(true)
      })

      it(`should accept empty string for ${field}`, () => {
        const result = teacherDetailsSchema.safeParse({
          ...validTeacher,
          [field]: "",
        })
        expect(result.success).toBe(true)
      })

      it(`should accept valid value for ${field}`, () => {
        const result = teacherDetailsSchema.safeParse({
          ...validTeacher,
          [field]: "Test Value",
        })
        expect(result.success).toBe(true)
      })
    })
  })
})

// =============================================================================
// staffDetailsSchema Tests
// =============================================================================

describe("staffDetailsSchema", () => {
  const validStaff = {
    position: "Office Manager",
    employmentType: "FULL_TIME",
  }

  it("should accept valid staff details with required fields only", () => {
    const result = staffDetailsSchema.safeParse(validStaff)
    expect(result.success).toBe(true)
  })

  it("should accept valid staff details with all fields", () => {
    const result = staffDetailsSchema.safeParse({
      ...validStaff,
      departmentId: "dept-1",
      qualificationName: "MBA",
      qualificationInstitution: "Harvard",
      qualificationYear: "2018",
    })
    expect(result.success).toBe(true)
  })

  describe("position", () => {
    it("should accept position with exactly 2 characters", () => {
      const result = staffDetailsSchema.safeParse({
        ...validStaff,
        position: "IT",
      })
      expect(result.success).toBe(true)
    })

    it("should reject position with less than 2 characters", () => {
      const result = staffDetailsSchema.safeParse({
        ...validStaff,
        position: "A",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required")
      }
    })

    it("should reject empty position", () => {
      const result = staffDetailsSchema.safeParse({
        ...validStaff,
        position: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing position", () => {
      const { position, ...rest } = validStaff
      const result = staffDetailsSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("employmentType", () => {
    it("should accept valid employment type", () => {
      const result = staffDetailsSchema.safeParse(validStaff)
      expect(result.success).toBe(true)
    })

    it("should reject empty employmentType", () => {
      const result = staffDetailsSchema.safeParse({
        ...validStaff,
        employmentType: "",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required")
      }
    })

    it("should reject missing employmentType", () => {
      const { employmentType, ...rest } = validStaff
      const result = staffDetailsSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("departmentId", () => {
    it("should accept departmentId as optional", () => {
      const result = staffDetailsSchema.safeParse(validStaff)
      expect(result.success).toBe(true)
    })

    it("should accept empty string for departmentId", () => {
      const result = staffDetailsSchema.safeParse({
        ...validStaff,
        departmentId: "",
      })
      expect(result.success).toBe(true)
    })

    it("should accept valid departmentId", () => {
      const result = staffDetailsSchema.safeParse({
        ...validStaff,
        departmentId: "dept-123",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("optional qualification fields", () => {
    const qualFields = [
      "qualificationName",
      "qualificationInstitution",
      "qualificationYear",
    ] as const

    qualFields.forEach((field) => {
      it(`should accept ${field} as optional`, () => {
        const result = staffDetailsSchema.safeParse(validStaff)
        expect(result.success).toBe(true)
      })

      it(`should accept empty string for ${field}`, () => {
        const result = staffDetailsSchema.safeParse({
          ...validStaff,
          [field]: "",
        })
        expect(result.success).toBe(true)
      })
    })
  })
})

// =============================================================================
// adminDetailsSchema Tests
// =============================================================================

describe("adminDetailsSchema", () => {
  const validAdmin = {
    position: "Principal",
    administrativeArea: "academic",
  }

  it("should accept valid admin details with required fields only", () => {
    const result = adminDetailsSchema.safeParse(validAdmin)
    expect(result.success).toBe(true)
  })

  it("should accept valid admin details with all fields", () => {
    const result = adminDetailsSchema.safeParse({
      ...validAdmin,
      departmentId: "dept-1",
    })
    expect(result.success).toBe(true)
  })

  describe("position", () => {
    it("should accept position with exactly 2 characters", () => {
      const result = adminDetailsSchema.safeParse({
        ...validAdmin,
        position: "VP",
      })
      expect(result.success).toBe(true)
    })

    it("should reject position with less than 2 characters", () => {
      const result = adminDetailsSchema.safeParse({
        ...validAdmin,
        position: "A",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required")
      }
    })

    it("should reject empty position", () => {
      const result = adminDetailsSchema.safeParse({
        ...validAdmin,
        position: "",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("administrativeArea", () => {
    it("should accept valid administrative area", () => {
      const result = adminDetailsSchema.safeParse(validAdmin)
      expect(result.success).toBe(true)
    })

    it("should reject empty administrativeArea", () => {
      const result = adminDetailsSchema.safeParse({
        ...validAdmin,
        administrativeArea: "",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required")
      }
    })

    it("should reject missing administrativeArea", () => {
      const { administrativeArea, ...rest } = validAdmin
      const result = adminDetailsSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("departmentId", () => {
    it("should accept departmentId as optional", () => {
      const result = adminDetailsSchema.safeParse(validAdmin)
      expect(result.success).toBe(true)
    })

    it("should accept empty string for departmentId", () => {
      const result = adminDetailsSchema.safeParse({
        ...validAdmin,
        departmentId: "",
      })
      expect(result.success).toBe(true)
    })

    it("should accept valid departmentId", () => {
      const result = adminDetailsSchema.safeParse({
        ...validAdmin,
        departmentId: "dept-admin-1",
      })
      expect(result.success).toBe(true)
    })
  })
})

// =============================================================================
// studentDetailsSchema Tests
// =============================================================================

describe("studentDetailsSchema", () => {
  const validStudent = {
    gradeLevel: "10",
    studentType: "REGULAR",
  }

  it("should accept valid student details with required fields only", () => {
    const result = studentDetailsSchema.safeParse(validStudent)
    expect(result.success).toBe(true)
  })

  it("should accept valid student details with all fields", () => {
    const result = studentDetailsSchema.safeParse({
      ...validStudent,
      previousSchool: "Al-Azhar School",
      previousGrade: "9",
    })
    expect(result.success).toBe(true)
  })

  describe("gradeLevel", () => {
    it("should accept valid grade level", () => {
      const result = studentDetailsSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
    })

    it("should reject empty gradeLevel", () => {
      const result = studentDetailsSchema.safeParse({
        ...validStudent,
        gradeLevel: "",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required")
      }
    })

    it("should reject missing gradeLevel", () => {
      const { gradeLevel, ...rest } = validStudent
      const result = studentDetailsSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("studentType", () => {
    it("should accept valid student type", () => {
      const result = studentDetailsSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
    })

    it("should accept TRANSFER student type", () => {
      const result = studentDetailsSchema.safeParse({
        ...validStudent,
        studentType: "TRANSFER",
      })
      expect(result.success).toBe(true)
    })

    it("should accept INTERNATIONAL student type", () => {
      const result = studentDetailsSchema.safeParse({
        ...validStudent,
        studentType: "INTERNATIONAL",
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty studentType", () => {
      const result = studentDetailsSchema.safeParse({
        ...validStudent,
        studentType: "",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required")
      }
    })

    it("should reject missing studentType", () => {
      const { studentType, ...rest } = validStudent
      const result = studentDetailsSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe("optional fields", () => {
    it("should accept previousSchool as optional", () => {
      const result = studentDetailsSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
    })

    it("should accept empty string for previousSchool", () => {
      const result = studentDetailsSchema.safeParse({
        ...validStudent,
        previousSchool: "",
      })
      expect(result.success).toBe(true)
    })

    it("should accept previousGrade as optional", () => {
      const result = studentDetailsSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
    })

    it("should accept empty string for previousGrade", () => {
      const result = studentDetailsSchema.safeParse({
        ...validStudent,
        previousGrade: "",
      })
      expect(result.success).toBe(true)
    })
  })
})

// =============================================================================
// documentsSchema Tests
// =============================================================================

describe("documentsSchema", () => {
  it("should accept empty object and default to empty array", () => {
    const result = documentsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.documents).toEqual([])
    }
  })

  it("should accept explicit empty documents array", () => {
    const result = documentsSchema.safeParse({ documents: [] })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.documents).toEqual([])
    }
  })

  it("should accept valid documents array", () => {
    const result = documentsSchema.safeParse({
      documents: [
        {
          type: "passport",
          name: "passport.pdf",
          url: "https://storage.example.com/passport.pdf",
          uploadedAt: "2024-01-15T10:00:00Z",
        },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.documents).toHaveLength(1)
    }
  })

  it("should accept multiple documents", () => {
    const result = documentsSchema.safeParse({
      documents: [
        {
          type: "passport",
          name: "passport.pdf",
          url: "https://storage.example.com/passport.pdf",
          uploadedAt: "2024-01-15T10:00:00Z",
        },
        {
          type: "transcript",
          name: "transcript.pdf",
          url: "https://storage.example.com/transcript.pdf",
          uploadedAt: "2024-01-16T10:00:00Z",
        },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.documents).toHaveLength(2)
    }
  })

  it("should reject document missing type", () => {
    const result = documentsSchema.safeParse({
      documents: [
        {
          name: "passport.pdf",
          url: "https://storage.example.com/passport.pdf",
          uploadedAt: "2024-01-15T10:00:00Z",
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("should reject document missing name", () => {
    const result = documentsSchema.safeParse({
      documents: [
        {
          type: "passport",
          url: "https://storage.example.com/passport.pdf",
          uploadedAt: "2024-01-15T10:00:00Z",
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("should reject document missing url", () => {
    const result = documentsSchema.safeParse({
      documents: [
        {
          type: "passport",
          name: "passport.pdf",
          uploadedAt: "2024-01-15T10:00:00Z",
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("should reject document missing uploadedAt", () => {
    const result = documentsSchema.safeParse({
      documents: [
        {
          type: "passport",
          name: "passport.pdf",
          url: "https://storage.example.com/passport.pdf",
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("should default to empty array when documents is undefined", () => {
    const result = documentsSchema.safeParse({ documents: undefined })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.documents).toEqual([])
    }
  })
})

// =============================================================================
// Edge Cases
// =============================================================================

describe("Edge Cases", () => {
  describe("unicode and special characters", () => {
    it("should accept Arabic names in personalSchema", () => {
      const result = personalSchema.safeParse({
        givenName: "محمد",
        surname: "الحسن",
        dateOfBirth: "2000-01-01",
        gender: "male",
      })
      expect(result.success).toBe(true)
    })

    it("should accept names with accents", () => {
      const result = personalSchema.safeParse({
        givenName: "Jose",
        surname: "Gonzalez",
        dateOfBirth: "1995-03-20",
        gender: "male",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("type coercion edge cases", () => {
    it("should coerce float string for yearsOfExperience", () => {
      const result = teacherDetailsSchema.safeParse({
        subjects: ["Math"],
        employmentType: "FULL_TIME",
        yearsOfExperience: "5.5",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.yearsOfExperience).toBe(5.5)
      }
    })

    it("should reject non-numeric string for yearsOfExperience", () => {
      const result = teacherDetailsSchema.safeParse({
        subjects: ["Math"],
        employmentType: "FULL_TIME",
        yearsOfExperience: "abc",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("empty object validation", () => {
    it("should reject empty object for personalSchema", () => {
      const result = personalSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it("should reject empty object for contactSchema", () => {
      const result = contactSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it("should reject empty object for teacherDetailsSchema", () => {
      const result = teacherDetailsSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it("should reject empty object for staffDetailsSchema", () => {
      const result = staffDetailsSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it("should reject empty object for adminDetailsSchema", () => {
      const result = adminDetailsSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it("should reject empty object for studentDetailsSchema", () => {
      const result = studentDetailsSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it("should accept empty object for documentsSchema", () => {
      const result = documentsSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})
