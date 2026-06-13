// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for /api/payment/[paymentId]/receipt route
 *
 * Covers:
 * - Status guard: PENDING_VERIFICATION returns 409
 * - Status guard: SUCCESS returns PDF (200)
 * - Status guard: PENDING returns 409
 * - Status guard: FAILED returns 409
 * - i18n: ar label map used when school.preferredLanguage === "ar"
 * - school name + currency come from school record
 */

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { checkCurrentUserPermission } from "@/components/school-dashboard/finance/lib/permissions"
import { GET } from "@/app/api/payment/[paymentId]/receipt/route"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    payment: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/action-errors", () => ({
  ACTION_ERRORS: {
    NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
    MISSING_SCHOOL: "MISSING_SCHOOL",
    NOT_FOUND: "NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
  },
}))

vi.mock("@/lib/payment/currency", () => ({
  formatCurrency: vi.fn((amount: number, _currency: string) => `${amount}`),
}))

vi.mock("@/components/school-dashboard/finance/fees/receipt-document", () => ({
  ReceiptDocument: vi.fn(() => null),
}))

vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkCurrentUserPermission: vi.fn(),
}))

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: vi.fn().mockResolvedValue(Buffer.from("pdf-content")),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockSession = { user: { id: "user-1", role: "ADMIN" } }
const mockTenant = { schoolId: "school-1", subdomain: "demo" }

function makeCtx(paymentId: string) {
  return { params: Promise.resolve({ paymentId }) }
}

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay-1",
    paymentNumber: "PAY-001",
    receiptNumber: "REC-001",
    amount: 1000,
    currency: "SAR",
    paymentDate: new Date("2025-01-01"),
    paymentMethod: "CASH",
    gatewayMethod: null,
    status: "SUCCESS",
    transactionId: null,
    student: {
      id: "stu-1",
      userId: "user-1",
      firstName: "Ali",
      lastName: "Hassan",
      studentGuardians: [],
    },
    feeAssignment: {
      academicYear: "2024-2025",
      feeStructure: { name: "Tuition" },
    },
    school: {
      name: "King Fahad School",
      currency: "SAR",
      logoUrl: null,
      preferredLanguage: "ar",
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue(mockSession as any)
  vi.mocked(getTenantContext).mockResolvedValue(mockTenant as any)
  vi.mocked(checkCurrentUserPermission).mockResolvedValue(true as any)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/payment/[paymentId]/receipt — status guard", () => {
  it("returns 409 for PENDING_VERIFICATION (receipt not available)", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue(
      makePayment({ status: "PENDING_VERIFICATION" }) as any
    )
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    const res = await GET(req, makeCtx("pay-1"))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.errorCode).toBe("RECEIPT_NOT_AVAILABLE")
  })

  it("returns 409 for PENDING", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue(
      makePayment({ status: "PENDING" }) as any
    )
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    const res = await GET(req, makeCtx("pay-1"))
    expect(res.status).toBe(409)
  })

  it("returns 409 for FAILED", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue(
      makePayment({ status: "FAILED" }) as any
    )
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    const res = await GET(req, makeCtx("pay-1"))
    expect(res.status).toBe(409)
  })

  it("returns 409 for CANCELLED", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue(
      makePayment({ status: "CANCELLED" }) as any
    )
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    const res = await GET(req, makeCtx("pay-1"))
    expect(res.status).toBe(409)
  })

  it("returns 200 PDF for SUCCESS", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue(
      makePayment({ status: "SUCCESS" }) as any
    )
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    const res = await GET(req, makeCtx("pay-1"))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("application/pdf")
  })

  it("returns 200 PDF for REFUNDED (dispute receipt)", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue(
      makePayment({ status: "REFUNDED" }) as any
    )
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    const res = await GET(req, makeCtx("pay-1"))
    expect(res.status).toBe(200)
  })
})

describe("GET /api/payment/[paymentId]/receipt — i18n labels", () => {
  it("passes Arabic label map when school.preferredLanguage is 'ar'", async () => {
    const { ReceiptDocument } =
      await import("@/components/school-dashboard/finance/fees/receipt-document")
    vi.mocked(db.payment.findFirst).mockResolvedValue(
      makePayment({
        school: {
          name: "مدرسة الملك فهد",
          currency: "SAR",
          logoUrl: null,
          preferredLanguage: "ar",
        },
      }) as any
    )
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    await GET(req, makeCtx("pay-1"))
    const callArgs = vi.mocked(ReceiptDocument).mock.calls[0]?.[0]
    expect(callArgs?.t?.paymentReceipt).toBe("إيصال دفع")
    expect(callArgs?.t?.amountPaid).toBe("المبلغ المدفوع")
  })

  it("passes English label map when school.preferredLanguage is 'en'", async () => {
    const { ReceiptDocument } =
      await import("@/components/school-dashboard/finance/fees/receipt-document")
    vi.mocked(db.payment.findFirst).mockResolvedValue(
      makePayment({
        school: {
          name: "Demo School",
          currency: "USD",
          logoUrl: null,
          preferredLanguage: "en",
        },
      }) as any
    )
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    await GET(req, makeCtx("pay-1"))
    const callArgs = vi.mocked(ReceiptDocument).mock.calls[0]?.[0]
    expect(callArgs?.t?.paymentReceipt).toBe("Payment Receipt")
    expect(callArgs?.t?.amountPaid).toBe("Amount Paid")
  })

  it("uses school name from school record, not a hardcoded fallback", async () => {
    const { ReceiptDocument } =
      await import("@/components/school-dashboard/finance/fees/receipt-document")
    vi.mocked(db.payment.findFirst).mockResolvedValue(
      makePayment({
        school: {
          name: "Al Noor Academy",
          currency: "AED",
          logoUrl: null,
          preferredLanguage: "en",
        },
      }) as any
    )
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    await GET(req, makeCtx("pay-1"))
    const callArgs = vi.mocked(ReceiptDocument).mock.calls[0]?.[0]
    expect(callArgs?.data?.schoolName).toBe("Al Noor Academy")
  })
})

describe("GET /api/payment/[paymentId]/receipt — auth", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    const res = await GET(req, makeCtx("pay-1"))
    expect(res.status).toBe(401)
  })

  it("returns 400 when no school context", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({ schoolId: null } as any)
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    const res = await GET(req, makeCtx("pay-1"))
    expect(res.status).toBe(400)
  })

  it("returns 404 when payment not found", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue(null)
    const req = new Request("http://localhost/api/payment/pay-1/receipt")
    const res = await GET(req, makeCtx("pay-1"))
    expect(res.status).toBe(404)
  })
})
