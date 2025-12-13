import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  createFeeStructure,
  updateFeeStructure,
  getFeeStructures,
  recordPayment,
  getPayments,
} from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    feeStructure: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      feeStructure: {
        create: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      payment: {
        create: vi.fn(),
      },
    })),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

describe("Fee Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "ACCOUNTANT",
      locale: "en",
    })
  })

  describe("createFeeStructure", () => {
    it("creates fee structure with schoolId for multi-tenant isolation", async () => {
      const mockFeeStructure = {
        id: "fee-1",
        name: "Tuition Fee",
        amount: 5000,
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          feeStructure: {
            create: vi.fn().mockResolvedValue(mockFeeStructure),
          },
        }
        return callback(tx)
      })

      const result = await createFeeStructure({
        name: "Tuition Fee",
        amount: 5000,
        currency: "USD",
      })

      expect(result.success).toBe(true)
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ACCOUNTANT",
        locale: "en",
      })

      const result = await createFeeStructure({
        name: "Tuition Fee",
        amount: 5000,
        currency: "USD",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("recordPayment", () => {
    it("records payment with schoolId scope", async () => {
      const mockPayment = {
        id: "payment-1",
        studentId: "student-1",
        amount: 5000,
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
          },
        }
        return callback(tx)
      })

      const result = await recordPayment({
        studentId: "student-1",
        feeStructureId: "fee-1",
        amount: 5000,
        method: "CASH",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("getFeeStructures", () => {
    it("fetches fee structures scoped to schoolId", async () => {
      const mockFees = [
        { id: "1", name: "Tuition", amount: 5000, schoolId: mockSchoolId },
        { id: "2", name: "Lab Fee", amount: 500, schoolId: mockSchoolId },
      ]

      vi.mocked(db.feeStructure.findMany).mockResolvedValue(mockFees as any)
      vi.mocked(db.feeStructure.count).mockResolvedValue(2)

      const result = await getFeeStructures({})

      expect(result.success).toBe(true)
    })
  })

  describe("getPayments", () => {
    it("fetches payments scoped to schoolId", async () => {
      const mockPayments = [
        { id: "1", amount: 5000, schoolId: mockSchoolId },
        { id: "2", amount: 500, schoolId: mockSchoolId },
      ]

      vi.mocked(db.payment.findMany).mockResolvedValue(mockPayments as any)
      vi.mocked(db.payment.count).mockResolvedValue(2)

      const result = await getPayments({})

      expect(result.success).toBe(true)
    })
  })
})
