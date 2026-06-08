// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { createInvoiceFromEnrollment } from "@/components/school-dashboard/finance/invoice/actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => {
  const mockTx = {
    userInvoiceAddress: {
      create: vi.fn(),
    },
    userInvoice: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  }
  return {
    db: {
      userInvoice: {
        create: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
      },
      userInvoiceAddress: {
        create: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(async (cb: any) => cb(mockTx)),
      // Expose mockTx so tests can control it
      __mockTx: mockTx,
    },
  }
})

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock(
  "@/components/school-dashboard/finance/invoice/lib/permissions",
  () => ({
    checkCurrentUserPermission: vi.fn(),
  })
)

vi.mock("@/components/school-dashboard/finance/invoice/validation", () => ({
  InvoiceSchemaZod: {},
}))

vi.mock("@/components/school-dashboard/finance/invoice/email.config", () => ({
  resend: { emails: { send: vi.fn() } },
}))

vi.mock(
  "@/components/school-dashboard/finance/invoice/send-invoice-email",
  () => ({
    SendInvoiceEmail: vi.fn(),
  })
)

// Access the mock transaction context
const mockTx = (db as any).__mockTx

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultParams = {
  schoolId: "school-123",
  userId: "user-1",
  studentName: "Ahmed Hassan",
  studentEmail: "ahmed@test.com",
  schoolName: "Test School",
  schoolAddress: "123 Main St",
  currency: "USD",
  items: [
    { name: "Tuition Fee", amount: 3000 },
    { name: "Lab Fee", amount: 2000 },
  ],
}

function setupMocks() {
  // Re-establish $transaction after vi.clearAllMocks()
  vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb(mockTx))
  // Also mock the invoice number generation query (called outside transaction)
  vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)
  // The transaction callback receives mockTx
  mockTx.userInvoiceAddress.create.mockResolvedValue({ id: "addr-1" })
  mockTx.userInvoice.create.mockResolvedValue({ id: "inv-1" })
  mockTx.userInvoice.findFirst.mockResolvedValue(null)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createInvoiceFromEnrollment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  // =========================================================================
  // Correct total calculation
  // =========================================================================

  it("creates invoice with correct total from fee items", async () => {
    const result = await createInvoiceFromEnrollment(defaultParams)

    expect(result.success).toBe(true)
    expect(result.invoiceId).toBe("inv-1")

    // Verify the userInvoice.create call includes correct totals
    expect(mockTx.userInvoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sub_total: 5000,
        total: 5000,
        currency: "USD",
        schoolId: "school-123",
        userId: "user-1",
        status: "UNPAID",
        notes: "Auto-generated from enrollment",
        items: {
          create: [
            {
              item_name: "Tuition Fee",
              quantity: 1,
              price: 3000,
              total: 3000,
              schoolId: "school-123",
            },
            {
              item_name: "Lab Fee",
              quantity: 1,
              price: 2000,
              total: 2000,
              schoolId: "school-123",
            },
          ],
        },
      }),
    })
  })

  // =========================================================================
  // Address records
  // =========================================================================

  it("creates from/to address records", async () => {
    const result = await createInvoiceFromEnrollment(defaultParams)

    expect(result.success).toBe(true)

    // From address (school)
    expect(mockTx.userInvoiceAddress.create).toHaveBeenCalledWith({
      data: {
        name: "Test School",
        address1: "123 Main St",
        schoolId: "school-123",
      },
    })

    // To address (student)
    expect(mockTx.userInvoiceAddress.create).toHaveBeenCalledWith({
      data: {
        name: "Ahmed Hassan",
        email: "ahmed@test.com",
        address1: "Student",
        schoolId: "school-123",
      },
    })

    // Called twice: once for from, once for to
    expect(mockTx.userInvoiceAddress.create).toHaveBeenCalledTimes(2)
  })

  // =========================================================================
  // Return value
  // =========================================================================

  it("returns success with invoiceId", async () => {
    mockTx.userInvoice.create.mockResolvedValue({ id: "inv-42" })

    const result = await createInvoiceFromEnrollment(defaultParams)

    expect(result.success).toBe(true)
    expect(result.invoiceId).toBe("inv-42")
    expect(result.error).toBeUndefined()
  })

  // =========================================================================
  // Empty items
  // =========================================================================

  it("returns success without creating invoice when items array is empty", async () => {
    const result = await createInvoiceFromEnrollment({
      ...defaultParams,
      items: [],
    })

    expect(result.success).toBe(true)
    // No invoice created when there are no items
    expect(result.invoiceId).toBeUndefined()
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  // =========================================================================
  // Single item
  // =========================================================================

  it("creates invoice with single item correctly", async () => {
    const result = await createInvoiceFromEnrollment({
      ...defaultParams,
      items: [{ name: "Registration Fee", amount: 500 }],
    })

    expect(result.success).toBe(true)
    expect(mockTx.userInvoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sub_total: 500,
        total: 500,
        items: {
          create: [
            {
              item_name: "Registration Fee",
              quantity: 1,
              price: 500,
              total: 500,
              schoolId: "school-123",
            },
          ],
        },
      }),
    })
  })

  // =========================================================================
  // Invoice number generation
  // =========================================================================

  it("generates invoice number with ENR prefix", async () => {
    // findFirst returns null, so first invoice number for school
    mockTx.userInvoice.findFirst?.mockResolvedValue(null)

    const result = await createInvoiceFromEnrollment(defaultParams)

    expect(result.success).toBe(true)
    // Invoice number should start with "ENR" + 2-digit year
    expect(mockTx.userInvoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        invoice_no: expect.stringMatching(/^ENR\d{2}\d{3}$/),
      }),
    })
  })

  // =========================================================================
  // Error handling
  // =========================================================================

  it("returns error when transaction fails", async () => {
    vi.mocked(db.$transaction).mockRejectedValue(
      new Error("Transaction deadlock")
    )

    const result = await createInvoiceFromEnrollment(defaultParams)

    expect(result.success).toBe(false)
    expect(result.error).toBe("Transaction deadlock")
  })

  it("returns generic error for non-Error exceptions", async () => {
    vi.mocked(db.$transaction).mockRejectedValue("unknown failure")

    const result = await createInvoiceFromEnrollment(defaultParams)

    expect(result.success).toBe(false)
    expect(result.error).toBe("Failed to create invoice")
  })

  // =========================================================================
  // Due date
  // =========================================================================

  it("uses provided dueDate when given", async () => {
    const customDueDate = new Date("2026-12-31")

    const result = await createInvoiceFromEnrollment({
      ...defaultParams,
      dueDate: customDueDate,
    })

    expect(result.success).toBe(true)
    expect(mockTx.userInvoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        due_date: customDueDate,
      }),
    })
  })

  it("defaults to 30 days from now when no dueDate given", async () => {
    const before = Date.now()
    const result = await createInvoiceFromEnrollment(defaultParams)
    const after = Date.now()

    expect(result.success).toBe(true)

    const createCall = mockTx.userInvoice.create.mock.calls[0][0]
    const dueDate = createCall.data.due_date.getTime()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

    // Due date should be approximately 30 days from now
    expect(dueDate).toBeGreaterThanOrEqual(before + thirtyDaysMs - 1000)
    expect(dueDate).toBeLessThanOrEqual(after + thirtyDaysMs + 1000)
  })

  // =========================================================================
  // School address fallback
  // =========================================================================

  it("uses 'School Address' fallback when schoolAddress is empty", async () => {
    const result = await createInvoiceFromEnrollment({
      ...defaultParams,
      schoolAddress: "",
    })

    expect(result.success).toBe(true)
    // From address should use fallback
    expect(mockTx.userInvoiceAddress.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Test School",
        address1: "School Address",
      }),
    })
  })
})
