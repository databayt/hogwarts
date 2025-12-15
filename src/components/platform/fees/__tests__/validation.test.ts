import { describe, expect, it } from "vitest"
import { z } from "zod"

// Fee validation schema tests
describe("Fee Validation Schemas", () => {
  const feeStructureSchema = z.object({
    name: z.string().min(1, "Fee name is required"),
    amount: z.number().positive("Amount must be positive"),
    currency: z.string().min(3).max(3).default("USD"),
    category: z
      .enum([
        "TUITION",
        "REGISTRATION",
        "EXAMINATION",
        "LABORATORY",
        "LIBRARY",
        "SPORTS",
        "TRANSPORT",
        "MEAL",
        "UNIFORM",
        "OTHER",
      ])
      .default("OTHER"),
    frequency: z
      .enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "SEMESTER", "YEARLY"])
      .default("ONE_TIME"),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
  })

  const paymentSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    feeStructureId: z.string().min(1, "Fee structure is required"),
    amount: z.number().positive("Amount must be positive"),
    method: z.enum([
      "CASH",
      "BANK_TRANSFER",
      "CARD",
      "CHEQUE",
      "MOBILE_MONEY",
      "OTHER",
    ]),
    reference: z.string().optional(),
    notes: z.string().optional(),
    paidDate: z.string().optional(),
  })

  const scholarshipSchema = z
    .object({
      name: z.string().min(1, "Scholarship name is required"),
      percentage: z.number().min(0).max(100).optional(),
      fixedAmount: z.number().positive().optional(),
      studentId: z.string().min(1, "Student is required"),
      feeStructureId: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      reason: z.string().optional(),
    })
    .refine(
      (data) => data.percentage !== undefined || data.fixedAmount !== undefined,
      {
        message: "Either percentage or fixed amount is required",
      }
    )

  describe("feeStructureSchema", () => {
    it("validates complete fee structure data", () => {
      const validData = {
        name: "Tuition Fee",
        amount: 5000,
        currency: "USD",
        category: "TUITION",
        frequency: "SEMESTER",
        description: "Semester tuition fee",
        isActive: true,
      }

      const result = feeStructureSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires name and positive amount", () => {
      const missingName = {
        amount: 5000,
        currency: "USD",
      }

      const zeroAmount = {
        name: "Fee",
        amount: 0,
        currency: "USD",
      }

      const negativeAmount = {
        name: "Fee",
        amount: -100,
        currency: "USD",
      }

      expect(feeStructureSchema.safeParse(missingName).success).toBe(false)
      expect(feeStructureSchema.safeParse(zeroAmount).success).toBe(false)
      expect(feeStructureSchema.safeParse(negativeAmount).success).toBe(false)
    })

    it("validates currency format", () => {
      const validCurrency = {
        name: "Fee",
        amount: 100,
        currency: "USD",
      }

      const invalidCurrency = {
        name: "Fee",
        amount: 100,
        currency: "US", // Too short
      }

      expect(feeStructureSchema.safeParse(validCurrency).success).toBe(true)
      expect(feeStructureSchema.safeParse(invalidCurrency).success).toBe(false)
    })

    it("validates category enum", () => {
      const validCategories = [
        "TUITION",
        "REGISTRATION",
        "EXAMINATION",
        "LABORATORY",
        "LIBRARY",
        "SPORTS",
        "TRANSPORT",
        "MEAL",
        "UNIFORM",
        "OTHER",
      ]

      validCategories.forEach((category) => {
        const data = { name: "Fee", amount: 100, category }
        expect(feeStructureSchema.safeParse(data).success).toBe(true)
      })
    })

    it("validates frequency enum", () => {
      const validFrequencies = [
        "ONE_TIME",
        "MONTHLY",
        "QUARTERLY",
        "SEMESTER",
        "YEARLY",
      ]

      validFrequencies.forEach((frequency) => {
        const data = { name: "Fee", amount: 100, frequency }
        expect(feeStructureSchema.safeParse(data).success).toBe(true)
      })
    })

    it("applies defaults", () => {
      const minimal = { name: "Fee", amount: 100 }
      const result = feeStructureSchema.parse(minimal)

      expect(result.currency).toBe("USD")
      expect(result.category).toBe("OTHER")
      expect(result.frequency).toBe("ONE_TIME")
      expect(result.isActive).toBe(true)
    })
  })

  describe("paymentSchema", () => {
    it("validates complete payment data", () => {
      const validData = {
        studentId: "student-123",
        feeStructureId: "fee-123",
        amount: 2500,
        method: "BANK_TRANSFER",
        reference: "TXN-12345",
        notes: "First installment",
        paidDate: "2024-09-15",
      }

      const result = paymentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires studentId, feeStructureId, amount, and method", () => {
      const missingStudent = {
        feeStructureId: "fee-123",
        amount: 2500,
        method: "CASH",
      }

      const missingMethod = {
        studentId: "student-123",
        feeStructureId: "fee-123",
        amount: 2500,
      }

      expect(paymentSchema.safeParse(missingStudent).success).toBe(false)
      expect(paymentSchema.safeParse(missingMethod).success).toBe(false)
    })

    it("validates payment method enum", () => {
      const validMethods = [
        "CASH",
        "BANK_TRANSFER",
        "CARD",
        "CHEQUE",
        "MOBILE_MONEY",
        "OTHER",
      ]

      validMethods.forEach((method) => {
        const data = {
          studentId: "s1",
          feeStructureId: "f1",
          amount: 100,
          method,
        }
        expect(paymentSchema.safeParse(data).success).toBe(true)
      })

      const invalidMethod = {
        studentId: "s1",
        feeStructureId: "f1",
        amount: 100,
        method: "BITCOIN",
      }
      expect(paymentSchema.safeParse(invalidMethod).success).toBe(false)
    })

    it("requires positive amount", () => {
      const zeroAmount = {
        studentId: "s1",
        feeStructureId: "f1",
        amount: 0,
        method: "CASH",
      }

      expect(paymentSchema.safeParse(zeroAmount).success).toBe(false)
    })
  })

  describe("scholarshipSchema", () => {
    it("validates scholarship with percentage", () => {
      const validData = {
        name: "Merit Scholarship",
        percentage: 50,
        studentId: "student-123",
        startDate: "2024-09-01",
        reason: "Academic excellence",
      }

      const result = scholarshipSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("validates scholarship with fixed amount", () => {
      const validData = {
        name: "Need-based Aid",
        fixedAmount: 1000,
        studentId: "student-123",
        startDate: "2024-09-01",
      }

      const result = scholarshipSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires either percentage or fixed amount", () => {
      const neitherProvided = {
        name: "Scholarship",
        studentId: "student-123",
        startDate: "2024-09-01",
      }

      const result = scholarshipSchema.safeParse(neitherProvided)
      expect(result.success).toBe(false)
    })

    it("validates percentage range", () => {
      const validPercentage = {
        name: "Scholarship",
        percentage: 50,
        studentId: "s1",
        startDate: "2024-01-01",
      }

      const overPercentage = {
        name: "Scholarship",
        percentage: 150,
        studentId: "s1",
        startDate: "2024-01-01",
      }

      expect(scholarshipSchema.safeParse(validPercentage).success).toBe(true)
      expect(scholarshipSchema.safeParse(overPercentage).success).toBe(false)
    })
  })
})
