// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  createInquirySchema,
  createOTPRequestSchema,
  createOTPVerifySchema,
  createTourBookingSchema,
  sessionDataSchema,
} from "@/components/school-marketing/admission/validation"

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
