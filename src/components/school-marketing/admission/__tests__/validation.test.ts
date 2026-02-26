// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  createApplicationStepSchemas,
  createFullApplicationSchema,
  createInquirySchema,
  createOTPRequestSchema,
  createOTPVerifySchema,
  createTourBookingSchema,
  sessionDataSchema,
} from "../validation"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const schemas = createApplicationStepSchemas()

// ---------------------------------------------------------------------------
// Tests: Personal Schema
// ---------------------------------------------------------------------------

describe("personal schema", () => {
  const { personal } = schemas

  it("accepts valid personal data", () => {
    const result = personal.safeParse({
      firstName: "Ahmed",
      lastName: "Mohamed",
      dateOfBirth: "2010-03-15",
      gender: "MALE",
      nationality: "Sudanese",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty firstName", () => {
    const result = personal.safeParse({
      firstName: "",
      lastName: "Mohamed",
      dateOfBirth: "2010-03-15",
      gender: "MALE",
      nationality: "Sudanese",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty lastName", () => {
    const result = personal.safeParse({
      firstName: "Ahmed",
      lastName: "",
      dateOfBirth: "2010-03-15",
      gender: "MALE",
      nationality: "Sudanese",
    })
    expect(result.success).toBe(false)
  })

  it("rejects name exceeding 50 characters", () => {
    const result = personal.safeParse({
      firstName: "A".repeat(51),
      lastName: "Mohamed",
      dateOfBirth: "2010-03-15",
      gender: "MALE",
      nationality: "Sudanese",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid gender value", () => {
    const result = personal.safeParse({
      firstName: "Ahmed",
      lastName: "Mohamed",
      dateOfBirth: "2010-03-15",
      gender: "INVALID",
      nationality: "Sudanese",
    })
    expect(result.success).toBe(false)
  })

  it("accepts all valid gender values", () => {
    for (const gender of ["MALE", "FEMALE", "OTHER"]) {
      const result = personal.safeParse({
        firstName: "Ahmed",
        lastName: "Mohamed",
        dateOfBirth: "2010-03-15",
        gender,
        nationality: "Sudanese",
      })
      expect(result.success).toBe(true)
    }
  })

  it("rejects empty nationality", () => {
    const result = personal.safeParse({
      firstName: "Ahmed",
      lastName: "Mohamed",
      dateOfBirth: "2010-03-15",
      gender: "MALE",
      nationality: "",
    })
    expect(result.success).toBe(false)
  })

  it("accepts optional middleName as empty string", () => {
    const result = personal.safeParse({
      firstName: "Ahmed",
      middleName: "",
      lastName: "Mohamed",
      dateOfBirth: "2010-03-15",
      gender: "MALE",
      nationality: "Sudanese",
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Tests: Contact Schema
// ---------------------------------------------------------------------------

describe("contact schema", () => {
  const { contact } = schemas

  const validContact = {
    email: "parent@example.com",
    phone: "+249123456789",
    address: "123 Main Street",
    city: "Khartoum",
    state: "Khartoum",
    postalCode: "11111",
    country: "Sudan",
  }

  it("accepts valid contact data", () => {
    const result = contact.safeParse(validContact)
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = contact.safeParse({ ...validContact, email: "not-email" })
    expect(result.success).toBe(false)
  })

  it("rejects short phone number", () => {
    const result = contact.safeParse({ ...validContact, phone: "123" })
    expect(result.success).toBe(false)
  })

  it("accepts optional alternatePhone as empty string", () => {
    const result = contact.safeParse({
      ...validContact,
      alternatePhone: "",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty address", () => {
    const result = contact.safeParse({ ...validContact, address: "" })
    expect(result.success).toBe(false)
  })

  it("rejects empty city", () => {
    const result = contact.safeParse({ ...validContact, city: "" })
    expect(result.success).toBe(false)
  })

  it("defaults country to Sudan", () => {
    const { country, ...withoutCountry } = validContact
    const result = contact.safeParse(withoutCountry)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.country).toBe("Sudan")
    }
  })
})

// ---------------------------------------------------------------------------
// Tests: Guardian Schema
// ---------------------------------------------------------------------------

describe("guardian schema", () => {
  const { guardian } = schemas

  const validGuardian = {
    fatherName: "Mohamed Ahmed",
    motherName: "Fatima Ali",
  }

  it("accepts valid data with required fields only", () => {
    const result = guardian.safeParse(validGuardian)
    expect(result.success).toBe(true)
  })

  it("rejects empty fatherName", () => {
    const result = guardian.safeParse({ ...validGuardian, fatherName: "" })
    expect(result.success).toBe(false)
  })

  it("rejects empty motherName", () => {
    const result = guardian.safeParse({ ...validGuardian, motherName: "" })
    expect(result.success).toBe(false)
  })

  it("accepts optional fields as empty strings", () => {
    const result = guardian.safeParse({
      ...validGuardian,
      fatherOccupation: "",
      fatherPhone: "",
      fatherEmail: "",
      motherOccupation: "",
      motherPhone: "",
      motherEmail: "",
      guardianName: "",
      guardianRelation: "",
      guardianPhone: "",
      guardianEmail: "",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid fatherEmail when provided", () => {
    const result = guardian.safeParse({
      ...validGuardian,
      fatherEmail: "not-an-email",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid motherEmail when provided", () => {
    const result = guardian.safeParse({
      ...validGuardian,
      motherEmail: "bad-email",
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests: Academic Schema
// ---------------------------------------------------------------------------

describe("academic schema", () => {
  const { academic } = schemas

  it("accepts valid data with required applyingForClass", () => {
    const result = academic.safeParse({ applyingForClass: "Grade 10" })
    expect(result.success).toBe(true)
  })

  it("rejects empty applyingForClass", () => {
    const result = academic.safeParse({ applyingForClass: "" })
    expect(result.success).toBe(false)
  })

  it("accepts all optional fields as empty strings", () => {
    const result = academic.safeParse({
      applyingForClass: "Grade 10",
      previousSchool: "",
      previousClass: "",
      previousMarks: "",
      previousPercentage: "",
      achievements: "",
      preferredStream: "",
      secondLanguage: "",
      thirdLanguage: "",
    })
    expect(result.success).toBe(true)
  })

  it("accepts optional fields when omitted", () => {
    const result = academic.safeParse({ applyingForClass: "Grade 5" })
    expect(result.success).toBe(true)
  })

  it("accepts data with all fields filled", () => {
    const result = academic.safeParse({
      applyingForClass: "Grade 10",
      previousSchool: "Old School",
      previousClass: "Grade 9",
      previousMarks: "85",
      previousPercentage: "85.5",
      achievements: "Science fair winner",
      preferredStream: "Science",
      secondLanguage: "English",
      thirdLanguage: "French",
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Tests: Documents Schema
// ---------------------------------------------------------------------------

describe("documents schema", () => {
  const { documents } = schemas

  it("accepts empty object (all fields optional)", () => {
    const result = documents.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts valid document array", () => {
    const result = documents.safeParse({
      documents: [
        {
          type: "birth_certificate",
          name: "cert.pdf",
          url: "https://example.com/cert.pdf",
          uploadedAt: "2026-01-01",
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("rejects document missing url", () => {
    const result = documents.safeParse({
      documents: [
        {
          type: "birth_certificate",
          name: "cert.pdf",
          uploadedAt: "2026-01-01",
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("accepts optional photoUrl and signatureUrl", () => {
    const result = documents.safeParse({
      photoUrl: "https://example.com/photo.jpg",
      signatureUrl: "",
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Tests: Full Application Schema
// ---------------------------------------------------------------------------

describe("createFullApplicationSchema", () => {
  const schema = createFullApplicationSchema()

  const completeData = {
    campaignId: "campaign-1",
    firstName: "Ahmed",
    lastName: "Mohamed",
    dateOfBirth: "2010-03-15",
    gender: "MALE" as const,
    nationality: "Sudanese",
    email: "parent@example.com",
    phone: "+249123456789",
    address: "123 Main Street",
    city: "Khartoum",
    state: "Khartoum",
    postalCode: "11111",
    country: "Sudan",
    fatherName: "Mohamed Ahmed",
    motherName: "Fatima Ali",
    applyingForClass: "Grade 10",
  }

  it("accepts complete valid application data", () => {
    const result = schema.safeParse(completeData)
    expect(result.success).toBe(true)
  })

  it("rejects when personal fields are missing", () => {
    const { firstName, ...without } = completeData
    const result = schema.safeParse(without)
    expect(result.success).toBe(false)
  })

  it("rejects when contact fields are missing", () => {
    const { email, ...without } = completeData
    const result = schema.safeParse(without)
    expect(result.success).toBe(false)
  })

  it("rejects when guardian fields are missing", () => {
    const { fatherName, ...without } = completeData
    const result = schema.safeParse(without)
    expect(result.success).toBe(false)
  })

  it("rejects when academic fields are missing", () => {
    const { applyingForClass, ...without } = completeData
    const result = schema.safeParse(without)
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests: Session Schema
// ---------------------------------------------------------------------------

describe("sessionDataSchema", () => {
  it("accepts valid session data", () => {
    const result = sessionDataSchema.safeParse({
      formData: { firstName: "Ahmed" },
      currentStep: 2,
      email: "test@example.com",
      campaignId: "campaign-1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects currentStep below 0", () => {
    const result = sessionDataSchema.safeParse({
      formData: {},
      currentStep: -1,
      email: "test@example.com",
    })
    expect(result.success).toBe(false)
  })

  it("rejects currentStep above 6", () => {
    const result = sessionDataSchema.safeParse({
      formData: {},
      currentStep: 7,
      email: "test@example.com",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = sessionDataSchema.safeParse({
      formData: {},
      currentStep: 0,
      email: "not-an-email",
    })
    expect(result.success).toBe(false)
  })

  it("accepts optional campaignId", () => {
    const result = sessionDataSchema.safeParse({
      formData: {},
      currentStep: 0,
      email: "test@example.com",
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Tests: Tour Booking Schema
// ---------------------------------------------------------------------------

describe("createTourBookingSchema", () => {
  const schema = createTourBookingSchema()

  const validBooking = {
    slotId: "slot-1",
    parentName: "Mohamed Ahmed",
    email: "parent@example.com",
    numberOfAttendees: 2,
  }

  it("accepts valid booking data", () => {
    const result = schema.safeParse(validBooking)
    expect(result.success).toBe(true)
  })

  it("rejects empty slotId", () => {
    const result = schema.safeParse({ ...validBooking, slotId: "" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = schema.safeParse({ ...validBooking, email: "bad" })
    expect(result.success).toBe(false)
  })

  it("rejects numberOfAttendees above 5", () => {
    const result = schema.safeParse({
      ...validBooking,
      numberOfAttendees: 6,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests: Inquiry Schema
// ---------------------------------------------------------------------------

describe("createInquirySchema", () => {
  const schema = createInquirySchema()

  it("accepts valid inquiry data", () => {
    const result = schema.safeParse({
      parentName: "Mohamed Ahmed",
      email: "parent@example.com",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty parentName", () => {
    const result = schema.safeParse({
      parentName: "",
      email: "parent@example.com",
    })
    expect(result.success).toBe(false)
  })

  it("defaults subscribeNewsletter to false", () => {
    const result = schema.safeParse({
      parentName: "Test",
      email: "test@example.com",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.subscribeNewsletter).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Tests: OTP Schemas
// ---------------------------------------------------------------------------

describe("OTP schemas", () => {
  describe("createOTPRequestSchema", () => {
    const schema = createOTPRequestSchema()

    it("accepts valid OTP request", () => {
      const result = schema.safeParse({
        applicationNumber: "APP-2026-ABC123",
        email: "test@example.com",
      })
      expect(result.success).toBe(true)
    })

    it("rejects empty applicationNumber", () => {
      const result = schema.safeParse({
        applicationNumber: "",
        email: "test@example.com",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createOTPVerifySchema", () => {
    const schema = createOTPVerifySchema()

    it("accepts valid 6-digit OTP", () => {
      const result = schema.safeParse({
        applicationNumber: "APP-2026-ABC123",
        otp: "123456",
      })
      expect(result.success).toBe(true)
    })

    it("rejects OTP with wrong length", () => {
      const result = schema.safeParse({
        applicationNumber: "APP-2026-ABC123",
        otp: "12345",
      })
      expect(result.success).toBe(false)
    })
  })
})
