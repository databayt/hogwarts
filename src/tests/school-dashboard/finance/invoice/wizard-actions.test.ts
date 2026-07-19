// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  completeInvoiceWizard,
  createDraftInvoice,
  deleteDraftInvoice,
  getInvoiceForWizard,
  updateInvoiceWizardStep,
} from "@/components/school-dashboard/finance/invoice/wizard/actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => {
  const createMock = () => ({
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  })
  return {
    db: {
      user: createMock(),
      financePermission: createMock(),
      userInvoice: createMock(),
      userInvoiceAddress: createMock(),
      userInvoiceItem: createMock(),
      $transaction: vi.fn((cb: (tx: any) => any) =>
        cb({
          userInvoice: {
            create: vi.fn().mockResolvedValue({ id: "draft-1" }),
            // Draft numbering: latest-number lookup + clash pre-check.
            findFirst: vi.fn().mockResolvedValue(null),
            deleteMany: vi.fn(),
          },
          userInvoiceAddress: {
            create: vi.fn().mockResolvedValue({ id: "addr-1" }),
            deleteMany: vi.fn(),
          },
          userInvoiceItem: {
            deleteMany: vi.fn(),
          },
          school: {
            findUnique: vi.fn().mockResolvedValue({ currency: "SDG" }),
          },
        })
      ),
    },
  }
})

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Helpers
// ============================================================================

const MOCK_USER_ID = "user-1"
const MOCK_SCHOOL_ID = "school-1"

/** Signed in as a role the finance permission check will resolve. Defaults to
 *  ADMIN, who passes on role alone (no FinancePermission row needed). */
function mockAuthSuccess(role: string = "ADMIN") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: MOCK_USER_ID, role, schoolId: MOCK_SCHOOL_ID },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: MOCK_SCHOOL_ID,
    subdomain: "demo",
  } as any)
  // checkFinancePermission re-reads the role from the DB rather than the session
  vi.mocked(db.user.findUnique).mockResolvedValue({
    role,
    schoolId: MOCK_SCHOOL_ID,
  } as any)
  vi.mocked(db.financePermission.findUnique).mockResolvedValue(null as any)
}

function mockAuthFailure() {
  vi.mocked(auth).mockResolvedValue(null)
}

function mockNoSchool() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: MOCK_USER_ID },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    subdomain: null,
  } as any)
}

// ============================================================================
// Tests
// ============================================================================

describe("wizard/actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthSuccess()
  })

  // ==========================================================================
  // createDraftInvoice
  // ==========================================================================

  describe("createDraftInvoice", () => {
    it("creates a draft invoice via transaction", async () => {
      const result = await createDraftInvoice()
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: "draft-1" })
      expect(db.$transaction).toHaveBeenCalled()
    })

    it("returns error when missing school context", async () => {
      mockNoSchool()
      const result = await createDraftInvoice()
      expect(result.success).toBe(false)
      expect(result.error).toBe("MISSING_SCHOOL")
    })

    it("returns error when not authenticated", async () => {
      mockAuthFailure()
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: MOCK_SCHOOL_ID,
        subdomain: "demo",
      } as any)

      const result = await createDraftInvoice()
      expect(result.success).toBe(false)
      expect(result.error).toBe("NOT_AUTHENTICATED")
    })

    it("handles transaction errors gracefully", async () => {
      vi.mocked(db.$transaction).mockRejectedValue(new Error("TX failed"))

      const result = await createDraftInvoice()
      expect(result.success).toBe(false)
      expect(result.error).toBe("TX failed")
    })
  })

  // ==========================================================================
  // getInvoiceForWizard
  // ==========================================================================

  describe("getInvoiceForWizard", () => {
    it("returns invoice data when found", async () => {
      const mockData = {
        id: "inv-1",
        invoice_no: "I26001",
        from: { id: "a1", name: "School" },
        to: { id: "a2", name: "Student" },
        items: [
          { id: "i1", item_name: "Fee", quantity: 1, price: 100, total: 100 },
        ],
      }
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(mockData as any)

      const result = await getInvoiceForWizard("inv-1")
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeTruthy()
      }
    })

    it("returns error when invoice not found", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      const result = await getInvoiceForWizard("nonexistent")
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("INVOICE_NOT_FOUND")
      }
    })

    it("scopes query by schoolId (tenant isolation)", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      await getInvoiceForWizard("inv-1")
      expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "inv-1",
            schoolId: MOCK_SCHOOL_ID,
          }),
        })
      )
    })

    it("returns error when missing school context", async () => {
      mockNoSchool()
      const result = await getInvoiceForWizard("inv-1")
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // completeInvoiceWizard
  // ==========================================================================

  describe("completeInvoiceWizard", () => {
    it("completes wizard and revalidates path", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        id: "inv-1",
        invoice_no: "I26001",
        items: [{ id: "i1" }],
      } as any)
      vi.mocked(db.userInvoice.updateMany).mockResolvedValue({ count: 1 })

      const result = await completeInvoiceWizard("inv-1")
      expect(result.success).toBe(true)
      expect(db.userInvoice.updateMany).toHaveBeenCalledWith({
        where: { id: "inv-1", schoolId: MOCK_SCHOOL_ID },
        data: { wizardStep: null },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/finance/invoice")
    })

    it("fails when invoice has no items", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        id: "inv-1",
        invoice_no: "I26001",
        items: [],
      } as any)

      const result = await completeInvoiceWizard("inv-1")
      expect(result.success).toBe(false)
      expect(result.error).toBe("VALIDATION_ERROR")
    })

    it("fails when invoice_no is empty", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        id: "inv-1",
        invoice_no: "",
        items: [{ id: "i1" }],
      } as any)

      const result = await completeInvoiceWizard("inv-1")
      expect(result.success).toBe(false)
      expect(result.error).toBe("VALIDATION_ERROR")
    })

    it("returns error when invoice not found", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      const result = await completeInvoiceWizard("nonexistent")
      expect(result.success).toBe(false)
      expect(result.error).toBe("INVOICE_NOT_FOUND")
    })
  })

  // ==========================================================================
  // updateInvoiceWizardStep
  // ==========================================================================

  describe("updateInvoiceWizardStep", () => {
    it("updates the wizard step", async () => {
      vi.mocked(db.userInvoice.updateMany).mockResolvedValue({ count: 1 })

      await updateInvoiceWizardStep("inv-1", "items")
      expect(db.userInvoice.updateMany).toHaveBeenCalledWith({
        where: { id: "inv-1", schoolId: MOCK_SCHOOL_ID },
        data: { wizardStep: "items" },
      })
    })

    it("silently fails on error", async () => {
      vi.mocked(db.userInvoice.updateMany).mockRejectedValue(
        new Error("DB error")
      )

      // Should not throw
      await expect(
        updateInvoiceWizardStep("inv-1", "items")
      ).resolves.toBeUndefined()
    })

    it("does nothing when not authenticated", async () => {
      mockAuthFailure()
      await updateInvoiceWizardStep("inv-1", "details")
      expect(db.userInvoice.updateMany).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteDraftInvoice
  // ==========================================================================

  describe("deleteDraftInvoice", () => {
    it("deletes draft with cascading cleanup via transaction", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        id: "draft-1",
        fromAddressId: "addr-1",
        toAddressId: "addr-2",
        wizardStep: "details",
      } as any)

      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
        const tx = {
          userInvoiceItem: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          userInvoice: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
          userInvoiceAddress: {
            deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        }
        return cb(tx)
      })

      const result = await deleteDraftInvoice("draft-1")
      expect(result.success).toBe(true)
      expect(db.$transaction).toHaveBeenCalled()
    })

    it("returns error when draft not found", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      const result = await deleteDraftInvoice("nonexistent")
      expect(result.success).toBe(false)
      expect(result.error).toBe("INVOICE_NOT_FOUND")
    })

    it("returns error when not authenticated", async () => {
      mockAuthFailure()
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: MOCK_SCHOOL_ID,
        subdomain: "demo",
      } as any)

      const result = await deleteDraftInvoice("draft-1")
      expect(result.success).toBe(false)
      expect(result.error).toBe("NOT_AUTHENTICATED")
    })

    it("only deletes invoices still in draft (wizardStep not null)", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      await deleteDraftInvoice("completed-inv")
      expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            wizardStep: { not: null },
          }),
        })
      )
    })
  })

  // ==========================================================================
  // Authorization
  //
  // Every export here is a "use server" endpoint: reaching it proves nothing
  // about the caller, and getTenantContext() only reflects the subdomain in
  // the request. A non-finance role must never touch invoice data, however it
  // arrives at the action.
  // ==========================================================================

  describe("authorization", () => {
    const UNPRIVILEGED = ["STUDENT", "GUARDIAN", "TEACHER", "USER"]

    it.each(UNPRIVILEGED)("refuses %s on getInvoiceForWizard", async (role) => {
      mockAuthSuccess(role)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        id: "inv-1",
      } as any)

      const result = await getInvoiceForWizard("inv-1")

      expect(result.success).toBe(false)
      expect(db.userInvoice.findFirst).not.toHaveBeenCalled()
    })

    it.each(UNPRIVILEGED)("refuses %s on createDraftInvoice", async (role) => {
      mockAuthSuccess(role)

      const result = await createDraftInvoice()

      expect(result.success).toBe(false)
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it.each(UNPRIVILEGED)(
      "refuses %s on completeInvoiceWizard",
      async (role) => {
        mockAuthSuccess(role)

        const result = await completeInvoiceWizard("inv-1")

        expect(result.success).toBe(false)
        expect(db.userInvoice.updateMany).not.toHaveBeenCalled()
      }
    )

    it.each(UNPRIVILEGED)("refuses %s on deleteDraftInvoice", async (role) => {
      mockAuthSuccess(role)

      const result = await deleteDraftInvoice("inv-1")

      expect(result.success).toBe(false)
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it.each(UNPRIVILEGED)(
      "refuses %s on updateInvoiceWizardStep",
      async (role) => {
        mockAuthSuccess(role)

        await updateInvoiceWizardStep("inv-1", "items")

        expect(db.userInvoice.updateMany).not.toHaveBeenCalled()
      }
    )

    it("refuses an anonymous caller even though the subdomain resolves", async () => {
      mockAuthFailure()
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: MOCK_SCHOOL_ID,
        subdomain: "demo",
      } as any)

      const result = await getInvoiceForWizard("inv-1")

      expect(result.success).toBe(false)
      expect(db.userInvoice.findFirst).not.toHaveBeenCalled()
    })

    it("allows ACCOUNTANT, who is a finance role", async () => {
      mockAuthSuccess("ACCOUNTANT")
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        id: "inv-1",
        from: {},
        to: {},
        items: [],
      } as any)

      const result = await getInvoiceForWizard("inv-1")

      expect(result.success).toBe(true)
    })
  })
})
