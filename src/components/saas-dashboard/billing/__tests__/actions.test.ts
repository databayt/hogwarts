// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import * as billing from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/lib/db", () => ({
  db: {
    invoice: {
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireOperator: vi.fn().mockResolvedValue({ userId: "u1" }),
  requireNotImpersonating: vi.fn().mockResolvedValue(undefined),
  logOperatorAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Tests
// ============================================================================

describe("billing/actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // invoiceUpdateStatus
  // ==========================================================================

  describe("invoiceUpdateStatus", () => {
    it("updates invoice status to paid", async () => {
      vi.mocked(db.invoice.update).mockResolvedValue({
        id: "i1",
        schoolId: "s1",
        status: "paid",
      } as any)

      const result = await billing.invoiceUpdateStatus({
        id: "i1",
        status: "paid",
      })

      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({ id: "i1", status: "paid" }),
      })
      expect(db.invoice.update).toHaveBeenCalledWith({
        where: { id: "i1" },
        data: expect.objectContaining({ status: "paid" }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/saas-dashboard/billing")
    })

    it("updates invoice status to void", async () => {
      vi.mocked(db.invoice.update).mockResolvedValue({
        id: "i1",
        schoolId: "s1",
        status: "void",
      } as any)

      const result = await billing.invoiceUpdateStatus({
        id: "i1",
        status: "void",
      })

      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({ status: "void" }),
      })
    })

    it("handles not found (db throws)", async () => {
      vi.mocked(db.invoice.update).mockRejectedValue(
        new Error("Record not found")
      )

      const result = await billing.invoiceUpdateStatus({
        id: "nope",
        status: "paid",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("Record not found")
      }
    })

    it("handles auth failure", async () => {
      const { requireOperator } =
        await import("@/components/saas-dashboard/lib/operator-auth")
      vi.mocked(requireOperator).mockRejectedValueOnce(new Error("Forbidden"))

      const result = await billing.invoiceUpdateStatus({
        id: "i1",
        status: "paid",
      })

      expect(result.success).toBe(false)
      expect(db.invoice.update).not.toHaveBeenCalled()
    })

    it("handles validation error for empty id", async () => {
      const result = await billing.invoiceUpdateStatus({
        id: "",
        status: "paid",
      })

      expect(result.success).toBe(false)
      expect(db.invoice.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // getInvoices
  // ==========================================================================

  describe("getInvoices", () => {
    it("returns paginated invoices", async () => {
      const mockInvoice = {
        id: "i1",
        stripeInvoiceId: "inv_123",
        amountDue: 9900,
        status: "paid",
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-01-31"),
        createdAt: new Date("2026-01-01"),
        school: { id: "s1", name: "Test School" },
        receipts: [],
      }
      vi.mocked(db.invoice.findMany).mockResolvedValue([mockInvoice] as any)
      vi.mocked(db.invoice.count).mockResolvedValue(1)

      const result = await billing.getInvoices({
        page: 1,
        perPage: 10,
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: "i1",
          tenantName: "Test School",
          amount: 9900,
          status: "paid",
        })
      )
    })

    it("applies status filter", async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([])
      vi.mocked(db.invoice.count).mockResolvedValue(0)

      await billing.getInvoices({
        page: 1,
        perPage: 10,
        status: "open",
      })

      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "open" }),
        })
      )
    })

    it("applies search filter", async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([])
      vi.mocked(db.invoice.count).mockResolvedValue(0)

      await billing.getInvoices({
        page: 1,
        perPage: 10,
        search: "test",
      })

      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                stripeInvoiceId: expect.objectContaining({
                  contains: "test",
                }),
              }),
            ]),
          }),
        })
      )
    })

    it("returns empty on error", async () => {
      const { requireOperator } =
        await import("@/components/saas-dashboard/lib/operator-auth")
      vi.mocked(requireOperator).mockRejectedValueOnce(new Error("Forbidden"))

      const result = await billing.getInvoices({ page: 1, perPage: 10 })

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  // ==========================================================================
  // getInvoicesCSV
  // ==========================================================================

  describe("getInvoicesCSV", () => {
    it("returns CSV string with headers", async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([
        {
          stripeInvoiceId: "inv_1",
          amountDue: 9900,
          amountPaid: 9900,
          status: "paid",
          periodStart: new Date("2026-01-01"),
          periodEnd: new Date("2026-01-31"),
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
          school: { name: "Test School", domain: "test.com" },
        },
      ] as any)

      const csv = await billing.getInvoicesCSV()

      expect(csv).toContain("Invoice Number")
      expect(csv).toContain("School Name")
      expect(csv).toContain("Test School")
    })

    it("applies filters to CSV export", async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([])

      await billing.getInvoicesCSV({ status: "paid" })

      expect(db.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "paid" }),
        })
      )
    })
  })
})
