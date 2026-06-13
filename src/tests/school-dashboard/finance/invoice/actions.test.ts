// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import * as actions from "@/components/school-dashboard/finance/invoice/actions"

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
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
  })
  const db: any = {
    userInvoice: createMock(),
    userInvoiceAddress: createMock(),
    userInvoiceItem: createMock(),
    userInvoiceSettings: createMock(),
    userInvoiceSignature: createMock(),
    user: createMock(),
    school: createMock(),
    payment: createMock(),
  }
  // Default: run the callback with the full mocked db as the tx client, so
  // per-test `vi.mocked(db.<model>.<method>)` setups apply inside the
  // transaction. Individual tests may override with their own mockImplementation.
  db.$transaction = vi.fn((cb: (tx: any) => any) => cb(db))
  return { db }
})

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkCurrentUserPermission: vi.fn().mockResolvedValue(true),
}))

vi.mock("@/components/school-dashboard/finance/invoice/email.config", () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock(
  "@/components/school-dashboard/finance/invoice/send-invoice-email",
  () => ({
    SendInvoiceEmail: vi.fn().mockReturnValue("<div>email</div>"),
  })
)

// ============================================================================
// Helpers
// ============================================================================

const MOCK_USER_ID = "user-1"
const MOCK_SCHOOL_ID = "school-1"

function mockAuthSuccess() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: MOCK_USER_ID, role: "ADMIN", schoolId: MOCK_SCHOOL_ID },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: MOCK_SCHOOL_ID,
    subdomain: "demo",
  } as any)
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

const validInvoiceData = {
  invoice_no: "I26001",
  invoice_date: new Date("2026-03-01"),
  due_date: new Date("2026-04-01"),
  currency: "USD",
  from: {
    name: "Test School",
    email: "school@test.com",
    address1: "123 School St",
  },
  to: {
    name: "Student Parent",
    email: "parent@test.com",
    address1: "456 Home Ave",
  },
  items: [{ item_name: "Tuition Fee", quantity: 1, price: 5000, total: 5000 }],
  sub_total: 5000,
  total: 5000,
  status: "UNPAID" as const,
}

const mockInvoice = {
  id: "inv-1",
  invoice_no: "I26001",
  invoice_date: new Date("2026-03-01"),
  due_date: new Date("2026-04-01"),
  currency: "USD",
  sub_total: { toNumber: () => 5000 },
  discount: null,
  tax_percentage: null,
  total: { toNumber: () => 5000 },
  amountPaid: 0,
  sentAt: null,
  feeAssignmentId: null,
  notes: "",
  status: "UNPAID",
  userId: MOCK_USER_ID,
  schoolId: MOCK_SCHOOL_ID,
  fromAddressId: "addr-1",
  toAddressId: "addr-2",
  wizardStep: null,
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
  from: {
    id: "addr-1",
    name: "Test School",
    email: "school@test.com",
    address1: "123 School St",
  },
  to: {
    id: "addr-2",
    name: "Student Parent",
    email: "parent@test.com",
    address1: "456 Home Ave",
  },
  items: [
    {
      id: "item-1",
      item_name: "Tuition Fee",
      quantity: 1,
      price: { toNumber: () => 5000 },
      total: { toNumber: () => 5000 },
    },
  ],
}

// A second user (student) who does not have privileged role
function mockAuthAsStudent() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "student-user", role: "STUDENT", schoolId: MOCK_SCHOOL_ID },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: MOCK_SCHOOL_ID,
    subdomain: "demo",
  } as any)
}

// ============================================================================
// Tests
// ============================================================================

describe("invoice/actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // clearAllMocks wipes call history but NOT implementations set via
    // mockImplementation in earlier tests, so re-establish the default
    // $transaction (run callback with the full mocked db as tx client).
    vi.mocked(db.$transaction).mockImplementation((cb: any) => cb(db))
    mockAuthSuccess()
  })

  // ==========================================================================
  // createInvoice
  // ==========================================================================

  describe("createInvoice", () => {
    it("returns auth error when not authenticated", async () => {
      mockAuthFailure()
      const result = await actions.createInvoice(validInvoiceData)
      expect(result.success).toBe(false)
      expect(result.error).toBe("NOT_AUTHENTICATED")
    })

    it("returns error when no school context", async () => {
      mockNoSchool()
      const result = await actions.createInvoice(validInvoiceData)
      expect(result.success).toBe(false)
      expect(result.error).toBe("MISSING_SCHOOL")
    })

    it("returns error when permission denied", async () => {
      const { checkCurrentUserPermission } =
        await import("@/components/school-dashboard/finance/lib/permissions")
      vi.mocked(checkCurrentUserPermission).mockResolvedValueOnce(false)

      const result = await actions.createInvoice(validInvoiceData)
      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })

    it("creates invoice successfully via transaction", async () => {
      const mockCreatedInvoice = { id: "inv-new", ...validInvoiceData }

      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
        const tx = {
          userInvoice: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockCreatedInvoice),
          },
          userInvoiceAddress: {
            create: vi
              .fn()
              .mockResolvedValueOnce({ id: "addr-1" })
              .mockResolvedValueOnce({ id: "addr-2" }),
          },
        }
        return cb(tx)
      })

      const result = await actions.createInvoice(validInvoiceData)
      expect(result.success).toBe(true)
      expect(db.$transaction).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith("/finance/invoice")
    })

    it("returns error for duplicate invoice number", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
        const tx = {
          userInvoice: {
            findFirst: vi.fn().mockResolvedValue({ id: "existing" }),
          },
          userInvoiceAddress: { create: vi.fn() },
        }
        return cb(tx)
      })

      const result = await actions.createInvoice(validInvoiceData)
      expect(result.success).toBe(false)
      expect(result.error).toBe("INVOICE_DUPLICATE_NUMBER")
    })
  })

  // ==========================================================================
  // createInvoiceWithAutoNumber
  // ==========================================================================

  describe("createInvoiceWithAutoNumber", () => {
    it("generates auto number and creates invoice", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      const mockCreated = { id: "inv-auto", invoice_no: "I26001" }
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
        const tx = {
          userInvoice: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockCreated),
          },
          userInvoiceAddress: {
            create: vi
              .fn()
              .mockResolvedValueOnce({ id: "addr-1" })
              .mockResolvedValueOnce({ id: "addr-2" }),
          },
        }
        return cb(tx)
      })

      const { invoice_no, ...dataWithoutNo } = validInvoiceData
      const result = await actions.createInvoiceWithAutoNumber(dataWithoutNo)
      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith("/finance/invoice")
    })

    it("returns auth error when not authenticated", async () => {
      mockAuthFailure()
      const { invoice_no, ...dataWithoutNo } = validInvoiceData
      const result = await actions.createInvoiceWithAutoNumber(dataWithoutNo)
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // getNextInvoiceNumber
  // ==========================================================================

  describe("getNextInvoiceNumber", () => {
    it("returns next invoice number for school", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      const result = await actions.getNextInvoiceNumber()
      expect(result.success).toBe(true)
      expect(result.data).toMatch(/^I\d{2}001$/)
    })

    it("increments from the latest invoice number", async () => {
      const year = new Date().getFullYear().toString().slice(-2)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        invoice_no: `I${year}005`,
      } as any)

      const result = await actions.getNextInvoiceNumber()
      expect(result.success).toBe(true)
      expect(result.data).toBe(`I${year}006`)
    })

    it("returns auth error when not authenticated", async () => {
      mockAuthFailure()
      const result = await actions.getNextInvoiceNumber()
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // getInvoices
  // ==========================================================================

  describe("getInvoices", () => {
    it("returns paginated invoices excluding wizard drafts", async () => {
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([mockInvoice] as any)
      vi.mocked(db.userInvoice.count).mockResolvedValue(1)

      const result = await actions.getInvoices(1, 5)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(db.userInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: MOCK_USER_ID,
            schoolId: MOCK_SCHOOL_ID,
            wizardStep: null,
          }),
        })
      )
    })

    it("returns empty list when no invoices", async () => {
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])
      vi.mocked(db.userInvoice.count).mockResolvedValue(0)

      const result = await actions.getInvoices()
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it("returns auth error when not authenticated", async () => {
      mockAuthFailure()
      const result = await actions.getInvoices()
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // getInvoicesWithFilters
  // ==========================================================================

  describe("getInvoicesWithFilters", () => {
    it("returns filtered invoices by status", async () => {
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([
        { ...mockInvoice, to: { name: "Test" } },
      ] as any)
      vi.mocked(db.userInvoice.count).mockResolvedValue(1)

      const result = await actions.getInvoicesWithFilters({ status: "PAID" })
      expect(result.success).toBe(true)
      expect(db.userInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PAID" }),
        })
      )
    })

    it("returns filtered invoices by invoice_no", async () => {
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])
      vi.mocked(db.userInvoice.count).mockResolvedValue(0)

      const result = await actions.getInvoicesWithFilters({
        invoice_no: "I26",
      })
      expect(result.success).toBe(true)
      expect(db.userInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invoice_no: { contains: "I26", mode: "insensitive" },
          }),
        })
      )
    })

    it("handles pagination params", async () => {
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])
      vi.mocked(db.userInvoice.count).mockResolvedValue(0)

      await actions.getInvoicesWithFilters({ page: 2, perPage: 10 })
      expect(db.userInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      )
    })

    it("returns error on auth failure", async () => {
      mockAuthFailure()
      const result = await actions.getInvoicesWithFilters({})
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // getInvoiceById
  // ==========================================================================

  describe("getInvoiceById", () => {
    it("returns invoice with Decimal-to-number conversion", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        sub_total: 5000,
        discount: null,
        tax_percentage: null,
        total: 5000,
        amountPaid: 0,
        sentAt: null,
        feeAssignmentId: null,
        items: [
          {
            id: "item-1",
            item_name: "Tuition Fee",
            quantity: 1,
            price: 5000,
            total: 5000,
          },
        ],
      } as any)
      vi.mocked(db.payment.findMany).mockResolvedValue([])

      const result = await actions.getInvoiceById("inv-1")
      expect(result.success).toBe(true)
      expect(typeof result.data.sub_total).toBe("number")
      expect(typeof result.data.total).toBe("number")
      expect(typeof result.data.amountPaid).toBe("number")
      expect(result.data.linkedPayments).toEqual([])
    })

    it("returns not found for nonexistent invoice", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      const result = await actions.getInvoiceById("nonexistent")
      expect(result.success).toBe(false)
      expect(result.error).toBe("INVOICE_NOT_FOUND")
    })

    // INV-001: ADMIN sees all school invoices (no userId filter)
    it("INV-001: ADMIN queries by schoolId only (no userId filter)", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        sub_total: 5000,
        total: 5000,
        amountPaid: 0,
        sentAt: null,
        feeAssignmentId: null,
        items: [],
      } as any)
      vi.mocked(db.payment.findMany).mockResolvedValue([])

      await actions.getInvoiceById("inv-1")
      expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1", schoolId: MOCK_SCHOOL_ID },
        })
      )
    })

    // INV-001: ACCOUNTANT sees all school invoices (no userId filter)
    it("INV-001: ACCOUNTANT queries by schoolId only (no userId filter)", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "ACCOUNTANT",
      } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        sub_total: 5000,
        total: 5000,
        amountPaid: 0,
        sentAt: null,
        feeAssignmentId: null,
        items: [],
      } as any)
      vi.mocked(db.payment.findMany).mockResolvedValue([])

      await actions.getInvoiceById("inv-1")
      expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1", schoolId: MOCK_SCHOOL_ID },
        })
      )
    })

    // INV-001: STUDENT (non-privileged) scoped to own userId
    it("INV-001: STUDENT queries include userId scope", async () => {
      mockAuthAsStudent()
      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "STUDENT",
      } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      await actions.getInvoiceById("inv-1")
      expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "inv-1",
            userId: "student-user",
            schoolId: MOCK_SCHOOL_ID,
          },
        })
      )
    })

    // INV-007: linked payments included when feeAssignmentId is set
    it("INV-007: includes linked payments when feeAssignmentId is set", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        sub_total: 5000,
        total: 5000,
        amountPaid: 1000,
        sentAt: null,
        feeAssignmentId: "fee-asgn-1",
        items: [],
      } as any)
      const mockPayments = [
        {
          id: "pay-1",
          paymentNumber: "PAY001",
          amount: 1000,
          currency: "USD",
          paymentDate: new Date("2026-03-15"),
          paymentMethod: "CASH",
          status: "SUCCESS",
        },
      ]
      vi.mocked(db.payment.findMany).mockResolvedValue(mockPayments as any)

      const result = await actions.getInvoiceById("inv-1")
      expect(result.success).toBe(true)
      expect(result.data.linkedPayments).toHaveLength(1)
      expect(result.data.linkedPayments[0].paymentNumber).toBe("PAY001")
      expect(typeof result.data.linkedPayments[0].amount).toBe("number")
      // payment query must be schoolId-scoped
      expect(db.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            feeAssignmentId: "fee-asgn-1",
            schoolId: MOCK_SCHOOL_ID,
          },
        })
      )
    })

    // no feeAssignmentId → payment query not made, linkedPayments empty
    it("returns empty linkedPayments when feeAssignmentId is null", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        sub_total: 5000,
        total: 5000,
        amountPaid: 0,
        sentAt: null,
        feeAssignmentId: null,
        items: [],
      } as any)

      const result = await actions.getInvoiceById("inv-1")
      expect(result.success).toBe(true)
      expect(result.data.linkedPayments).toEqual([])
      expect(db.payment.findMany).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // updateInvoice
  // ==========================================================================

  describe("updateInvoice", () => {
    const updateData = {
      invoice_no: "I26001",
      invoice_date: new Date("2026-03-01"),
      due_date: new Date("2026-04-01"),
      currency: "USD",
      from: { name: "School", email: "s@t.com", address1: "Addr" },
      to: { name: "Parent", email: "p@t.com", address1: "Addr" },
      items: [{ item_name: "Fee", quantity: 1, price: 1000, total: 1000 }],
      sub_total: 1000,
      total: 1000,
    }

    it("updates invoice successfully (ADMIN sees all)", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        fromAddressId: "addr-1",
        toAddressId: "addr-2",
        items: [],
      } as any)
      vi.mocked(db.userInvoiceAddress.update).mockResolvedValue({} as any)
      vi.mocked(db.userInvoiceItem.deleteMany).mockResolvedValue({ count: 0 })
      vi.mocked(db.userInvoice.update).mockResolvedValue({
        id: "inv-1",
        ...updateData,
      } as any)

      const result = await actions.updateInvoice("inv-1", updateData)
      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith("/finance/invoice")
    })

    // INV-001: ADMIN query must NOT include userId
    it("INV-001: ADMIN findFirst query has no userId filter", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      await actions.updateInvoice("inv-1", updateData)
      expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1", schoolId: MOCK_SCHOOL_ID },
        })
      )
    })

    // INV-001: STUDENT (non-privileged) query must include userId
    it("INV-001: STUDENT findFirst query includes userId scope", async () => {
      mockAuthAsStudent()
      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "STUDENT",
      } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      await actions.updateInvoice("inv-1", updateData)
      expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "inv-1",
            userId: "student-user",
            schoolId: MOCK_SCHOOL_ID,
          },
        })
      )
    })

    it("returns error for not found invoice", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      const result = await actions.updateInvoice("nonexistent", updateData)
      expect(result.success).toBe(false)
      expect(result.error).toBe("INVOICE_NOT_FOUND")
    })

    it("returns error when permission denied", async () => {
      const { checkCurrentUserPermission } =
        await import("@/components/school-dashboard/finance/lib/permissions")
      vi.mocked(checkCurrentUserPermission).mockResolvedValueOnce(false)

      const result = await actions.updateInvoice("inv-1", updateData)
      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })
  })

  // ==========================================================================
  // deleteInvoice
  // ==========================================================================

  describe("deleteInvoice", () => {
    it("deletes invoice and revalidates (ADMIN)", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(mockInvoice as any)
      vi.mocked(db.userInvoice.delete).mockResolvedValue(mockInvoice as any)

      const result = await actions.deleteInvoice({ id: "inv-1" })
      expect(result.success).toBe(true)
      expect(db.userInvoice.delete).toHaveBeenCalledWith({
        where: { id: "inv-1" },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/finance/invoice")
    })

    // INV-001: ADMIN delete query has no userId filter
    it("INV-001: ADMIN delete findFirst query has no userId filter", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      await actions.deleteInvoice({ id: "inv-1" })
      expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1", schoolId: MOCK_SCHOOL_ID },
        })
      )
    })

    it("returns error for not found invoice (not throw)", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

      const result = await actions.deleteInvoice({ id: "nonexistent" })
      expect(result.success).toBe(false)
      expect(result.error).toBe("INVOICE_NOT_FOUND")
    })

    it("returns error when permission denied", async () => {
      const { checkCurrentUserPermission } =
        await import("@/components/school-dashboard/finance/lib/permissions")
      vi.mocked(checkCurrentUserPermission).mockResolvedValueOnce(false)

      const result = await actions.deleteInvoice({ id: "inv-1" })
      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })
  })

  // ==========================================================================
  // sendInvoiceEmail
  // ==========================================================================

  describe("sendInvoiceEmail", () => {
    it("sends email successfully and stamps sentAt", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        total: 5000,
      } as any)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        preferredLanguage: "en",
      } as any)
      vi.mocked(db.userInvoice.update).mockResolvedValue({} as any)

      const result = await actions.sendInvoiceEmail("inv-1", "Your Invoice")
      expect(result.success).toBe(true)
      // sentAt must be stamped on success
      expect(db.userInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1" },
          data: expect.objectContaining({ sentAt: expect.any(Date) }),
        })
      )
    })

    // INV-001: ADMIN can send email for any school invoice (no userId filter)
    it("INV-001: ADMIN findFirst for email has no userId filter", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        preferredLanguage: "en",
      } as any)

      await actions.sendInvoiceEmail("inv-1", "Subject")
      expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1", schoolId: MOCK_SCHOOL_ID },
        })
      )
    })

    // INV-005: invoice URL must use clean /${lang}/finance path
    it("INV-005: email contains clean /${lang}/finance/invoice/invoice/view/ URL", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        total: 5000,
      } as any)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        preferredLanguage: "en",
      } as any)
      vi.mocked(db.userInvoice.update).mockResolvedValue({} as any)

      const { SendInvoiceEmail } =
        await import("@/components/school-dashboard/finance/invoice/send-invoice-email")

      await actions.sendInvoiceEmail("inv-1", "Subject")

      expect(SendInvoiceEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceURL: expect.stringContaining(
            "/finance/invoice/invoice/view/inv-1"
          ),
        })
      )
      // must NOT contain the old broken path
      const callArg = (vi.mocked(SendInvoiceEmail).mock.calls.at(-1) as any)[0]
      expect(callArg.invoiceURL).not.toContain("/invoice/paid/")
    })

    // INV-008: must NOT use onboarding@resend.dev hardcoded sender
    it("INV-008: does not use hardcoded onboarding@resend.dev sender", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        total: 5000,
      } as any)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        preferredLanguage: "en",
      } as any)
      vi.mocked(db.userInvoice.update).mockResolvedValue({} as any)

      const { resend } =
        await import("@/components/school-dashboard/finance/invoice/email.config")

      await actions.sendInvoiceEmail("inv-1", "Subject")

      const sendCall = vi.mocked(resend.emails.send).mock.calls.at(-1) as any
      expect(sendCall[0].from).not.toBe("Invoice <onboarding@resend.dev>")
    })

    it("returns error when invoice not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        preferredLanguage: "en",
      } as any)

      const result = await actions.sendInvoiceEmail("nope", "Subject")
      expect(result.success).toBe(false)
      expect(result.error).toBe("INVOICE_NOT_FOUND")
    })

    it("returns error when client has no email", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        to: { ...mockInvoice.to, email: null },
        total: 5000,
      } as any)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        preferredLanguage: "en",
      } as any)

      const result = await actions.sendInvoiceEmail("inv-1", "Subject")
      expect(result.success).toBe(false)
      expect(result.error).toBe("NOT_FOUND")
    })

    it("returns error when Resend fails", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        total: 5000,
      } as any)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        preferredLanguage: "en",
      } as any)

      const { resend } =
        await import("@/components/school-dashboard/finance/invoice/email.config")
      vi.mocked(resend.emails.send).mockResolvedValueOnce({
        error: { message: "Rate limited" },
      } as any)

      const result = await actions.sendInvoiceEmail("inv-1", "Subject")
      expect(result.success).toBe(false)
      expect(result.error).toBe("EMAIL_SEND_FAILED")
    })

    it("does not stamp sentAt when send fails", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        total: 5000,
      } as any)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        preferredLanguage: "en",
      } as any)

      const { resend } =
        await import("@/components/school-dashboard/finance/invoice/email.config")
      vi.mocked(resend.emails.send).mockResolvedValueOnce({
        error: { message: "Network error" },
      } as any)

      await actions.sendInvoiceEmail("inv-1", "Subject")
      // update should NOT have been called because send failed
      expect(db.userInvoice.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Settings
  // ==========================================================================

  describe("updateSettings / getSettings", () => {
    it("creates new settings when none exist", async () => {
      vi.mocked(db.userInvoiceSettings.findUnique).mockResolvedValue(null)
      vi.mocked(db.userInvoiceSettings.create).mockResolvedValue({
        id: "set-1",
        invoiceLogo: "logo.png",
      } as any)

      const result = await actions.updateSettings({ invoiceLogo: "logo.png" })
      expect(result.success).toBe(true)
      expect(db.userInvoiceSettings.create).toHaveBeenCalled()
    })

    it("updates existing settings", async () => {
      vi.mocked(db.userInvoiceSettings.findUnique).mockResolvedValue({
        id: "set-1",
        userId: MOCK_USER_ID,
      } as any)
      vi.mocked(db.userInvoiceSettings.update).mockResolvedValue({
        id: "set-1",
        invoiceLogo: "new-logo.png",
      } as any)

      const result = await actions.updateSettings({
        invoiceLogo: "new-logo.png",
      })
      expect(result.success).toBe(true)
      expect(db.userInvoiceSettings.update).toHaveBeenCalled()
    })

    it("fetches settings", async () => {
      vi.mocked(db.userInvoiceSettings.findUnique).mockResolvedValue({
        id: "set-1",
      } as any)

      const result = await actions.getSettings()
      expect(result.success).toBe(true)
    })
  })

  // ==========================================================================
  // getDashboardStats
  // ==========================================================================

  describe("getDashboardStats", () => {
    it("returns dashboard stats with revenue calculation (ADMIN)", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([
        { invoice_date: new Date(), total: 1000, status: "PAID" },
        { invoice_date: new Date(), total: 2000, status: "UNPAID" },
      ] as any)
      vi.mocked(db.userInvoice.count)
        .mockResolvedValueOnce(2) // total
        .mockResolvedValueOnce(1) // paid
        .mockResolvedValueOnce(1) // unpaid
      vi.mocked(db.userInvoice.findMany).mockResolvedValueOnce([
        { invoice_date: new Date(), total: 1000, status: "PAID" },
        { invoice_date: new Date(), total: 2000, status: "UNPAID" },
      ] as any)

      const result = await actions.getDashboardStats()
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty("totalRevenue")
      expect(result.data).toHaveProperty("chartData")
    })

    // INV-004: ADMIN query has no userId filter
    it("INV-004: ADMIN stats query has no userId filter", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])
      vi.mocked(db.userInvoice.count).mockResolvedValue(0)

      await actions.getDashboardStats()

      // All findMany/count calls should NOT include userId
      const allCalls = [
        ...vi.mocked(db.userInvoice.findMany).mock.calls,
        ...vi.mocked(db.userInvoice.count).mock.calls,
      ]
      for (const [args] of allCalls) {
        expect((args as any)?.where).not.toHaveProperty("userId")
      }
    })

    // INV-004: STUDENT (non-privileged) query must include userId
    it("INV-004: STUDENT stats query includes userId scope", async () => {
      mockAuthAsStudent()
      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "STUDENT",
      } as any)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])
      vi.mocked(db.userInvoice.count).mockResolvedValue(0)

      await actions.getDashboardStats()

      const firstFindManyCall = vi.mocked(db.userInvoice.findMany).mock
        .calls[0][0] as any
      expect(firstFindManyCall?.where?.userId).toBe("student-user")
    })

    it("returns auth error when not authenticated", async () => {
      mockAuthFailure()
      const result = await actions.getDashboardStats()
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // createInvoiceFromEnrollment
  // ==========================================================================

  describe("createInvoiceFromEnrollment", () => {
    it("creates invoice from enrollment fees via transaction", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
        const tx = {
          userInvoiceAddress: {
            create: vi.fn().mockResolvedValue({ id: "addr-1" }),
          },
          userInvoice: {
            create: vi.fn().mockResolvedValue({ id: "inv-enr" }),
          },
        }
        return cb(tx)
      })

      const result = await actions.createInvoiceFromEnrollment({
        schoolId: MOCK_SCHOOL_ID,
        userId: MOCK_USER_ID,
        studentName: "John Doe",
        studentEmail: "john@test.com",
        schoolName: "Test School",
        schoolAddress: "123 St",
        currency: "USD",
        items: [{ name: "Registration", amount: 500 }],
      })

      expect(result.success).toBe(true)
      expect(result.invoiceId).toBe("inv-enr")
    })

    it("returns success with no invoice when items are empty", async () => {
      const result = await actions.createInvoiceFromEnrollment({
        schoolId: MOCK_SCHOOL_ID,
        userId: MOCK_USER_ID,
        studentName: "John Doe",
        studentEmail: "john@test.com",
        schoolName: "Test School",
        schoolAddress: "123 St",
        currency: "USD",
        items: [],
      })

      expect(result.success).toBe(true)
      expect(result.invoiceId).toBeUndefined()
    })

    it("handles database errors gracefully", async () => {
      vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)
      vi.mocked(db.$transaction).mockRejectedValue(new Error("DB error"))

      const result = await actions.createInvoiceFromEnrollment({
        schoolId: MOCK_SCHOOL_ID,
        userId: MOCK_USER_ID,
        studentName: "John Doe",
        studentEmail: "john@test.com",
        schoolName: "Test School",
        schoolAddress: "123 St",
        currency: "USD",
        items: [{ name: "Fee", amount: 100 }],
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("DB error")
    })
  })
})
