// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { requireOperator } from "@/components/saas-dashboard/lib/operator-auth"

import { getReceipts, reviewReceipt, uploadReceipt } from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireOperator: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    receipt: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Helpers
// ============================================================================

function mockOperator() {
  vi.mocked(requireOperator).mockResolvedValue({ userId: "dev-1" })
}

function mockOperatorForbidden() {
  vi.mocked(requireOperator).mockRejectedValue(new Error("Forbidden"))
}

function makeApprovedReceipt(overrides = {}) {
  return {
    id: "r1",
    invoiceId: "inv-1",
    amount: 5000,
    status: "approved",
    reviewedAt: new Date(),
    notes: null,
    invoice: { id: "inv-1", schoolId: "s1" },
    ...overrides,
  }
}

function makeRejectedReceipt(overrides = {}) {
  return {
    id: "r1",
    invoiceId: "inv-1",
    amount: 5000,
    status: "rejected",
    reviewedAt: new Date(),
    notes: "Invalid receipt",
    invoice: { id: "inv-1", schoolId: "s1" },
    ...overrides,
  }
}

function makeDbReceipt(overrides = {}) {
  return {
    id: "r1",
    invoiceId: "inv-1",
    amount: 5000,
    fileUrl: "https://example.com/receipt.pdf",
    fileName: "receipt.pdf",
    status: "pending",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    reviewedAt: null,
    notes: null,
    invoice: {
      id: "inv-1",
      stripeInvoiceId: "in_abc123",
      school: { name: "Hogwarts Academy" },
    },
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("Receipt Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // reviewReceipt
  // ==========================================================================

  describe("reviewReceipt", () => {
    it("approves receipt and marks invoice as paid", async () => {
      mockOperator()
      const receipt = makeApprovedReceipt()
      vi.mocked(db.receipt.update).mockResolvedValue(receipt as any)
      vi.mocked(db.invoice.update).mockResolvedValue({} as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      const result = await reviewReceipt({
        receiptId: "r1",
        status: "approved",
      })

      expect(result).toEqual({ success: true })
      expect(db.receipt.update).toHaveBeenCalledWith({
        where: { id: "r1" },
        data: expect.objectContaining({
          status: "approved",
          reviewedAt: expect.any(Date),
        }),
        include: {
          invoice: {
            select: { id: true, schoolId: true },
          },
        },
      })
      expect(db.invoice.update).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: expect.objectContaining({
          status: "paid",
          amountPaid: 5000,
          updatedAt: expect.any(Date),
        }),
      })
    })

    it("rejects receipt without marking invoice as paid", async () => {
      mockOperator()
      const receipt = makeRejectedReceipt()
      vi.mocked(db.receipt.update).mockResolvedValue(receipt as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      const result = await reviewReceipt({
        receiptId: "r1",
        status: "rejected",
        notes: "Invalid receipt",
      })

      expect(result).toEqual({ success: true })
      expect(db.receipt.update).toHaveBeenCalledWith({
        where: { id: "r1" },
        data: expect.objectContaining({
          status: "rejected",
          notes: "Invalid receipt",
        }),
        include: expect.any(Object),
      })
      expect(db.invoice.update).not.toHaveBeenCalled()
    })

    it("creates audit log with receipt_approved action", async () => {
      mockOperator()
      const receipt = makeApprovedReceipt()
      vi.mocked(db.receipt.update).mockResolvedValue(receipt as any)
      vi.mocked(db.invoice.update).mockResolvedValue({} as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      await reviewReceipt({ receiptId: "r1", status: "approved" })

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "receipt_approved",
          userId: "operator",
          schoolId: "s1",
        }),
      })
    })

    it("creates audit log with receipt_rejected action", async () => {
      mockOperator()
      const receipt = makeRejectedReceipt()
      vi.mocked(db.receipt.update).mockResolvedValue(receipt as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      await reviewReceipt({
        receiptId: "r1",
        status: "rejected",
        notes: "Blurry image",
      })

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "receipt_rejected",
          userId: "operator",
          schoolId: "s1",
          reason: "Blurry image",
        }),
      })
    })

    it("uses default reason when notes are not provided", async () => {
      mockOperator()
      const receipt = makeApprovedReceipt()
      vi.mocked(db.receipt.update).mockResolvedValue(receipt as any)
      vi.mocked(db.invoice.update).mockResolvedValue({} as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      await reviewReceipt({ receiptId: "r1", status: "approved" })

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: "Receipt approved for invoice inv-1",
        }),
      })
    })

    it("returns error when receipt not found (db throws)", async () => {
      mockOperator()
      vi.mocked(db.receipt.update).mockRejectedValue(
        new Error("Record not found")
      )

      const result = await reviewReceipt({
        receiptId: "nonexistent",
        status: "approved",
      })

      expect(result).toEqual({
        success: false,
        error: { message: "Record not found" },
      })
      expect(db.invoice.update).not.toHaveBeenCalled()
      expect(db.auditLog.create).not.toHaveBeenCalled()
    })

    it("returns error on auth failure", async () => {
      mockOperatorForbidden()

      const result = await reviewReceipt({
        receiptId: "r1",
        status: "approved",
      })

      expect(result).toEqual({
        success: false,
        error: { message: "Forbidden" },
      })
      expect(db.receipt.update).not.toHaveBeenCalled()
    })

    it("returns error on validation failure - missing receiptId", async () => {
      mockOperator()

      const result = await reviewReceipt({
        receiptId: "",
        status: "approved",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.receipt.update).not.toHaveBeenCalled()
    })

    it("returns error on validation failure - invalid status", async () => {
      mockOperator()

      const result = await reviewReceipt({
        receiptId: "r1",
        status: "invalid" as any,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.receipt.update).not.toHaveBeenCalled()
    })

    it("revalidates billing paths on success", async () => {
      mockOperator()
      const receipt = makeApprovedReceipt()
      vi.mocked(db.receipt.update).mockResolvedValue(receipt as any)
      vi.mocked(db.invoice.update).mockResolvedValue({} as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      await reviewReceipt({ receiptId: "r1", status: "approved" })

      expect(revalidatePath).toHaveBeenCalledWith("/billing")
      expect(revalidatePath).toHaveBeenCalledWith("/billing/receipts")
    })

    it("does not revalidate paths on failure", async () => {
      mockOperatorForbidden()

      await reviewReceipt({ receiptId: "r1", status: "approved" })

      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // uploadReceipt
  // ==========================================================================

  describe("uploadReceipt", () => {
    const validUpload = {
      invoiceId: "inv-1",
      amount: 5000,
      fileName: "receipt.pdf",
      fileUrl: "https://example.com/receipt.pdf",
    }

    it("uploads receipt successfully", async () => {
      mockOperator()
      vi.mocked(db.invoice.findUnique).mockResolvedValue({
        schoolId: "s1",
      } as any)
      vi.mocked(db.receipt.create).mockResolvedValue({
        id: "r-new",
      } as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      const result = await uploadReceipt(validUpload)

      expect(result).toEqual({ success: true, receiptId: "r-new" })
      expect(db.receipt.create).toHaveBeenCalledWith({
        data: {
          invoiceId: "inv-1",
          amount: 5000,
          fileName: "receipt.pdf",
          fileUrl: "https://example.com/receipt.pdf",
          status: "pending",
        },
      })
    })

    it("returns error for non-existent invoice", async () => {
      mockOperator()
      vi.mocked(db.invoice.findUnique).mockResolvedValue(null)

      const result = await uploadReceipt(validUpload)

      expect(result).toEqual({
        success: false,
        error: { message: "Invoice not found" },
      })
      expect(db.receipt.create).not.toHaveBeenCalled()
    })

    it("creates audit log with correct data", async () => {
      mockOperator()
      vi.mocked(db.invoice.findUnique).mockResolvedValue({
        schoolId: "s1",
      } as any)
      vi.mocked(db.receipt.create).mockResolvedValue({
        id: "r-new",
      } as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      await uploadReceipt(validUpload)

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "receipt_uploaded",
          userId: "operator",
          schoolId: "s1",
          reason: expect.stringContaining("receipt.pdf"),
        }),
      })
    })

    it("includes formatted amount in audit log reason", async () => {
      mockOperator()
      vi.mocked(db.invoice.findUnique).mockResolvedValue({
        schoolId: "s1",
      } as any)
      vi.mocked(db.receipt.create).mockResolvedValue({
        id: "r-new",
      } as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      await uploadReceipt(validUpload)

      const auditCall = vi.mocked(db.auditLog.create).mock.calls[0][0]
      expect(auditCall.data.reason).toContain("$50.00")
    })

    it("returns error on auth failure", async () => {
      mockOperatorForbidden()

      const result = await uploadReceipt(validUpload)

      expect(result).toEqual({
        success: false,
        error: { message: "Forbidden" },
      })
      expect(db.invoice.findUnique).not.toHaveBeenCalled()
      expect(db.receipt.create).not.toHaveBeenCalled()
    })

    it("returns error on validation failure - missing invoiceId", async () => {
      mockOperator()

      const result = await uploadReceipt({
        ...validUpload,
        invoiceId: "",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.invoice.findUnique).not.toHaveBeenCalled()
    })

    it("returns error on validation failure - negative amount", async () => {
      mockOperator()

      const result = await uploadReceipt({
        ...validUpload,
        amount: -100,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.invoice.findUnique).not.toHaveBeenCalled()
    })

    it("returns error on validation failure - invalid URL", async () => {
      mockOperator()

      const result = await uploadReceipt({
        ...validUpload,
        fileUrl: "not-a-url",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("revalidates billing paths on success", async () => {
      mockOperator()
      vi.mocked(db.invoice.findUnique).mockResolvedValue({
        schoolId: "s1",
      } as any)
      vi.mocked(db.receipt.create).mockResolvedValue({
        id: "r-new",
      } as any)
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

      await uploadReceipt(validUpload)

      expect(revalidatePath).toHaveBeenCalledWith("/billing")
      expect(revalidatePath).toHaveBeenCalledWith("/billing/receipts")
    })

    it("returns error on database failure", async () => {
      mockOperator()
      vi.mocked(db.invoice.findUnique).mockResolvedValue({
        schoolId: "s1",
      } as any)
      vi.mocked(db.receipt.create).mockRejectedValue(
        new Error("Database connection lost")
      )

      const result = await uploadReceipt(validUpload)

      expect(result).toEqual({
        success: false,
        error: { message: "Database connection lost" },
      })
    })
  })

  // ==========================================================================
  // getReceipts
  // ==========================================================================

  describe("getReceipts", () => {
    it("returns paginated receipts", async () => {
      mockOperator()
      const dbReceipt = makeDbReceipt()
      vi.mocked(db.receipt.findMany).mockResolvedValue([dbReceipt] as any)
      vi.mocked(db.receipt.count).mockResolvedValue(1)

      const result = await getReceipts({ page: 1, perPage: 10 })

      expect(result.success).toBe(true)
      expect(result.total).toBe(1)
      expect(result.data).toHaveLength(1)
      expect(result.data![0]).toEqual({
        id: "r1",
        schoolName: "Hogwarts Academy",
        invoiceNumber: "in_abc123",
        amount: 5000,
        fileUrl: "https://example.com/receipt.pdf",
        fileName: "receipt.pdf",
        status: "pending",
        uploadedAt: "2026-01-15T10:00:00.000Z",
        reviewedAt: null,
        notes: null,
      })
    })

    it("calculates correct offset for pagination", async () => {
      mockOperator()
      vi.mocked(db.receipt.findMany).mockResolvedValue([] as any)
      vi.mocked(db.receipt.count).mockResolvedValue(0)

      await getReceipts({ page: 3, perPage: 20 })

      expect(db.receipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        })
      )
    })

    it("applies status filter", async () => {
      mockOperator()
      vi.mocked(db.receipt.findMany).mockResolvedValue([] as any)
      vi.mocked(db.receipt.count).mockResolvedValue(0)

      await getReceipts({ page: 1, perPage: 10, status: "approved" })

      expect(db.receipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "approved" }),
        })
      )
    })

    it("ignores status filter when set to 'all'", async () => {
      mockOperator()
      vi.mocked(db.receipt.findMany).mockResolvedValue([] as any)
      vi.mocked(db.receipt.count).mockResolvedValue(0)

      await getReceipts({ page: 1, perPage: 10, status: "all" })

      const callArg = vi.mocked(db.receipt.findMany).mock.calls[0][0]
      expect(callArg?.where).not.toHaveProperty("status")
    })

    it("applies search filter on invoice and school name", async () => {
      mockOperator()
      vi.mocked(db.receipt.findMany).mockResolvedValue([] as any)
      vi.mocked(db.receipt.count).mockResolvedValue(0)

      await getReceipts({ page: 1, perPage: 10, search: "hogwarts" })

      const callArg = vi.mocked(db.receipt.findMany).mock.calls[0][0]
      expect(callArg?.where).toHaveProperty("OR")
      expect(callArg?.where?.OR).toHaveLength(2)
    })

    it("returns empty array on auth failure", async () => {
      mockOperatorForbidden()

      const result = await getReceipts({ page: 1, perPage: 10 })

      expect(result).toEqual({
        success: false,
        error: { message: "Forbidden" },
        data: [],
        total: 0,
      })
    })

    it("returns empty array on database error", async () => {
      mockOperator()
      vi.mocked(db.receipt.findMany).mockRejectedValue(
        new Error("Connection timeout")
      )

      const result = await getReceipts({ page: 1, perPage: 10 })

      expect(result).toEqual({
        success: false,
        error: { message: "Connection timeout" },
        data: [],
        total: 0,
      })
    })

    it("orders receipts by createdAt descending", async () => {
      mockOperator()
      vi.mocked(db.receipt.findMany).mockResolvedValue([] as any)
      vi.mocked(db.receipt.count).mockResolvedValue(0)

      await getReceipts({ page: 1, perPage: 10 })

      expect(db.receipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      )
    })

    it("formats reviewedAt when present", async () => {
      mockOperator()
      const reviewDate = new Date("2026-02-01T14:30:00Z")
      const dbReceipt = makeDbReceipt({
        status: "approved",
        reviewedAt: reviewDate,
      })
      vi.mocked(db.receipt.findMany).mockResolvedValue([dbReceipt] as any)
      vi.mocked(db.receipt.count).mockResolvedValue(1)

      const result = await getReceipts({ page: 1, perPage: 10 })

      expect(result.data![0].reviewedAt).toBe("2026-02-01T14:30:00.000Z")
      expect(result.data![0].status).toBe("approved")
    })
  })
})
