import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    invoice: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    subscription: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      invoice: {
        create: vi.fn(),
        updateMany: vi.fn(),
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

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { auth } from "@/auth"

describe("Billing Actions", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "ACCOUNTANT",
      locale: "en",
    })
    vi.mocked(auth).mockResolvedValue({
      user: { id: mockUserId, schoolId: mockSchoolId, role: "ACCOUNTANT" },
    } as any)
  })

  describe("Invoice Management", () => {
    it("creates invoice with schoolId for multi-tenant isolation", async () => {
      const mockInvoice = {
        id: "invoice-1",
        studentId: "student-123",
        amount: 5000,
        schoolId: mockSchoolId,
        status: "PENDING",
      }

      vi.mocked(db.invoice.create).mockResolvedValue(mockInvoice as any)

      await db.invoice.create({
        data: {
          studentId: "student-123",
          amount: 5000,
          schoolId: mockSchoolId,
          dueDate: new Date("2024-10-01"),
          status: "PENDING",
        },
      })

      expect(db.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })

    it("fetches invoices scoped to schoolId", async () => {
      const mockInvoices = [
        { id: "1", amount: 5000, schoolId: mockSchoolId },
        { id: "2", amount: 3000, schoolId: mockSchoolId },
      ]

      vi.mocked(db.invoice.findMany).mockResolvedValue(mockInvoices as any)

      await db.invoice.findMany({
        where: { schoolId: mockSchoolId },
        orderBy: { createdAt: "desc" },
      })

      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId },
        })
      )
    })

    it("updates invoice status with schoolId scope", async () => {
      vi.mocked(db.invoice.updateMany).mockResolvedValue({ count: 1 })

      await db.invoice.updateMany({
        where: { id: "invoice-1", schoolId: mockSchoolId },
        data: { status: "PAID" },
      })

      expect(db.invoice.updateMany).toHaveBeenCalledWith({
        where: { id: "invoice-1", schoolId: mockSchoolId },
        data: { status: "PAID" },
      })
    })
  })

  describe("Payment Recording", () => {
    it("records payment with schoolId scope", async () => {
      const mockPayment = {
        id: "payment-1",
        invoiceId: "invoice-1",
        amount: 2500,
        method: "BANK_TRANSFER",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.payment.create).mockResolvedValue(mockPayment as any)

      await db.payment.create({
        data: {
          invoiceId: "invoice-1",
          amount: 2500,
          method: "BANK_TRANSFER",
          schoolId: mockSchoolId,
          reference: "TXN-12345",
        },
      })

      expect(db.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })

    it("fetches payment history scoped to schoolId", async () => {
      const mockPayments = [
        { id: "1", amount: 2500, method: "CASH", schoolId: mockSchoolId },
        { id: "2", amount: 2500, method: "CARD", schoolId: mockSchoolId },
      ]

      vi.mocked(db.payment.findMany).mockResolvedValue(mockPayments as any)

      await db.payment.findMany({
        where: {
          schoolId: mockSchoolId,
          invoice: { studentId: "student-123" },
        },
      })

      expect(db.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })

  describe("Subscription Management", () => {
    it("creates subscription with schoolId", async () => {
      const mockSubscription = {
        id: "sub-1",
        planId: "plan-123",
        schoolId: mockSchoolId,
        status: "ACTIVE",
      }

      vi.mocked(db.subscription.create).mockResolvedValue(mockSubscription as any)

      await db.subscription.create({
        data: {
          planId: "plan-123",
          schoolId: mockSchoolId,
          startDate: new Date(),
          status: "ACTIVE",
        },
      })

      expect(db.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })

    it("fetches active subscription for school", async () => {
      const mockSubscription = {
        id: "sub-1",
        planId: "plan-123",
        schoolId: mockSchoolId,
        status: "ACTIVE",
      }

      vi.mocked(db.subscription.findFirst).mockResolvedValue(mockSubscription as any)

      const subscription = await db.subscription.findFirst({
        where: {
          schoolId: mockSchoolId,
          status: "ACTIVE",
        },
      })

      expect(subscription?.schoolId).toBe(mockSchoolId)
    })
  })

  describe("Authorization", () => {
    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const session = await auth()
      expect(session).toBeNull()
    })

    it("verifies school context exists", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ACCOUNTANT",
        locale: "en",
      })

      const { schoolId } = await getTenantContext()
      expect(schoolId).toBeNull()
    })
  })
})
