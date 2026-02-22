import { describe, expect, it } from "vitest"

import { campaignSchema, campaignSchemaWithValidation } from "../validation"

describe("Admission Validation", () => {
  const validCampaign = {
    name: "Fall 2025 Admissions",
    academicYear: "2025-2026",
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-06-30"),
    status: "OPEN" as const,
    totalSeats: 100,
  }

  describe("campaignSchema", () => {
    it("accepts valid campaign data", () => {
      const result = campaignSchema.safeParse(validCampaign)
      expect(result.success).toBe(true)
    })

    it("accepts campaign with optional fields", () => {
      const result = campaignSchema.safeParse({
        ...validCampaign,
        description: "Fall admissions for Grade 1-6",
        applicationFee: 50,
      })
      expect(result.success).toBe(true)
    })

    it("rejects name shorter than 3 characters", () => {
      const result = campaignSchema.safeParse({ ...validCampaign, name: "AB" })
      expect(result.success).toBe(false)
    })

    it("rejects name longer than 100 characters", () => {
      const result = campaignSchema.safeParse({
        ...validCampaign,
        name: "A".repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it("rejects missing academic year", () => {
      const result = campaignSchema.safeParse({
        ...validCampaign,
        academicYear: "",
      })
      expect(result.success).toBe(false)
    })

    it("rejects invalid status", () => {
      const result = campaignSchema.safeParse({
        ...validCampaign,
        status: "INVALID",
      })
      expect(result.success).toBe(false)
    })

    it("accepts all valid status values", () => {
      for (const status of [
        "DRAFT",
        "OPEN",
        "CLOSED",
        "PROCESSING",
        "COMPLETED",
      ]) {
        const result = campaignSchema.safeParse({
          ...validCampaign,
          status,
        })
        expect(result.success).toBe(true)
      }
    })

    it("rejects totalSeats less than 1", () => {
      const result = campaignSchema.safeParse({
        ...validCampaign,
        totalSeats: 0,
      })
      expect(result.success).toBe(false)
    })

    it("rejects negative application fee", () => {
      const result = campaignSchema.safeParse({
        ...validCampaign,
        applicationFee: -10,
      })
      expect(result.success).toBe(false)
    })

    it("accepts null application fee", () => {
      const result = campaignSchema.safeParse({
        ...validCampaign,
        applicationFee: null,
      })
      expect(result.success).toBe(true)
    })

    it("coerces date strings to Date objects", () => {
      const result = campaignSchema.safeParse({
        ...validCampaign,
        startDate: "2025-03-01",
        endDate: "2025-06-30",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("campaignSchemaWithValidation", () => {
    it("accepts valid campaign with end date after start date", () => {
      const result = campaignSchemaWithValidation.safeParse(validCampaign)
      expect(result.success).toBe(true)
    })

    it("rejects end date before start date", () => {
      const result = campaignSchemaWithValidation.safeParse({
        ...validCampaign,
        startDate: new Date("2025-06-30"),
        endDate: new Date("2025-03-01"),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const endDateError = result.error.issues.find((i) =>
          i.path.includes("endDate")
        )
        expect(endDateError?.message).toBe("End date must be after start date")
      }
    })

    it("rejects end date equal to start date", () => {
      const sameDate = new Date("2025-06-01")
      const result = campaignSchemaWithValidation.safeParse({
        ...validCampaign,
        startDate: sameDate,
        endDate: sameDate,
      })
      expect(result.success).toBe(false)
    })
  })
})
