// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

const h = vi.hoisted(() => ({
  loadFamilyMoney: vi.fn(),
  createFeeCheckoutCore: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    student: { findFirst: vi.fn() },
    studentGuardian: { findFirst: vi.fn() },
  },
}))
vi.mock("@/components/school-dashboard/finance/family/queries", () => ({
  loadFamilyMoney: h.loadFamilyMoney,
}))
vi.mock("@/components/school-dashboard/finance/fees/checkout-core", () => ({
  createFeeCheckoutCore: h.createFeeCheckoutCore,
}))
vi.mock("@/components/school-dashboard/finance/fees/tenant-url", () => ({
  resolveTenantBaseUrl: vi.fn(async (d: string) => `https://${d}.balqalam.com`),
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"
const USER = "user-1"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER,
    email: "parent@e.com",
    schoolId: SCHOOL,
    role,
  })
}

const get = (path: string) =>
  new NextRequest(`http://localhost/api/mobile/fees${path}`, {
    headers: { Authorization: "Bearer test" },
  })

const inst = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  number: 1,
  count: 2,
  invoiceNo: `INV-${id}`,
  shareToken: null,
  dueDate: "2026-09-01T00:00:00.000Z",
  amount: 100,
  paidAmount: 40,
  status: "OVERDUE",
  feeAssignmentId: "fa-1",
  feeName: "Tuition",
  studentId: "stu-1",
  studentName: "Khadija",
  academicYear: "2026",
  ...extra,
})

const money = {
  role: "GUARDIAN",
  studentNames: ["Khadija", "Omar"],
  studentLabel: "Khadija and Omar",
  currency: "SDG",
  methods: ["bankak", "stripe"],
  fees: [
    {
      id: "fa-1",
      feeName: "Tuition",
      studentId: "stu-1",
      studentName: "Khadija",
      academicYear: "2026",
      total: 200,
      discount: 0,
      paid: 40,
      pendingVerification: 10,
      remaining: 160,
      status: "PARTIAL",
      installments: [],
    },
    {
      id: "fa-2",
      feeName: "Bus",
      studentId: "stu-2",
      studentName: "Omar",
      academicYear: "2026",
      total: 50,
      discount: 0,
      paid: 0,
      pendingVerification: 0,
      remaining: 50,
      status: "PENDING",
      installments: [],
    },
  ],
  installments: [
    inst("inv-1", { shareToken: "tok" }),
    inst("inv-2", { status: "PENDING", paidAmount: 0 }),
    inst("fa-2", {
      invoiceNo: undefined,
      dueDate: null,
      feeAssignmentId: "fa-2",
      studentId: "stu-2",
      studentName: "Omar",
      amount: 50,
      paidAmount: 0,
      status: "PENDING",
    }),
  ],
  due: [] as unknown[],
  payments: [
    {
      id: "pay-1",
      feeAssignmentId: "fa-1",
      paymentNumber: "P-1",
      receiptNumber: "R-1",
      amount: 40,
      paymentDate: "2026-08-01T00:00:00.000Z",
      paymentMethod: "BANK_TRANSFER",
      status: "SUCCESS",
      feeName: "Tuition",
      academicYear: "2026",
      studentId: "stu-1",
      studentName: "Khadija",
    },
  ],
  totals: {
    billed: 250,
    paid: 40,
    pendingVerification: 10,
    remaining: 210,
    overdue: 60,
  },
  nextDue: null,
}
money.due = money.installments

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.school.findUnique).mockResolvedValue({
    domain: "kingfahd",
  } as never)
  h.loadFamilyMoney.mockResolvedValue(money)
})

describe("GET /api/mobile/fees/invoices", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/fees/invoices/route")
    expect((await GET(get("/invoices"))).status).toBe(401)
  })

  it("403 for staff roles (family money only)", async () => {
    await authAs("TEACHER")
    const { GET } = await import("@/app/api/mobile/fees/invoices/route")
    expect((await GET(get("/invoices"))).status).toBe(403)
    expect(h.loadFamilyMoney).not.toHaveBeenCalled()
  })

  it("reads the family resolution with the bearer user/school/role and lang", async () => {
    await authAs("GUARDIAN")
    const { GET } = await import("@/app/api/mobile/fees/invoices/route")
    const body = await (await GET(get("/invoices?lang=en"))).json()
    expect(h.loadFamilyMoney).toHaveBeenCalledWith({
      userId: USER,
      schoolId: SCHOOL,
      role: "GUARDIAN",
      lang: "en",
    })
    expect(body).toMatchObject({
      total: 3,
      page: 1,
      per_page: 20,
      currency: "SDG",
      totals: { billed: 250, overdue: 60, pending_verification: 10 },
      methods: ["bankak", "stripe"],
    })
    expect(body.data[0]).toEqual({
      id: "inv-1",
      invoice_no: "INV-inv-1",
      fee_assignment_id: "fa-1",
      fee_name: "Tuition",
      student_id: "stu-1",
      student_name: "Khadija",
      academic_year: "2026",
      installment_number: 1,
      installment_count: 2,
      due_date: "2026-09-01T00:00:00.000Z",
      amount: 100,
      paid_amount: 40,
      remaining: 60,
      currency: "SDG",
      status: "OVERDUE",
      share_url: "https://kingfahd.balqalam.com/en/invoice/tok",
    })
  })

  it("filters by student_id and status", async () => {
    await authAs("GUARDIAN")
    const { GET } = await import("@/app/api/mobile/fees/invoices/route")
    const body = await (
      await GET(get("/invoices?student_id=stu-1&status=PENDING"))
    ).json()
    expect(body.data.map((d: { id: string }) => d.id)).toEqual(["inv-2"])
  })

  it("403 for a student_id outside the family", async () => {
    await authAs("GUARDIAN")
    vi.mocked(db.studentGuardian.findFirst).mockResolvedValue(null)
    const { GET } = await import("@/app/api/mobile/fees/invoices/route")
    expect((await GET(get("/invoices?student_id=stranger"))).status).toBe(403)
    expect(db.studentGuardian.findFirst).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL,
        studentId: "stranger",
        guardian: { userId: USER },
      },
      select: { id: true },
    })
  })

  it("empty list when the caller has no student record", async () => {
    await authAs("STUDENT")
    h.loadFamilyMoney.mockResolvedValue(null)
    const { GET } = await import("@/app/api/mobile/fees/invoices/route")
    const body = await (await GET(get("/invoices"))).json()
    expect(body).toMatchObject({ data: [], total: 0 })
  })
})

describe("GET /api/mobile/fees/invoices/:id", () => {
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

  it("404 for an invoice outside the family", async () => {
    await authAs("GUARDIAN")
    const { GET } = await import("@/app/api/mobile/fees/invoices/[id]/route")
    expect((await GET(get("/invoices/other"), ctx("other"))).status).toBe(404)
  })

  it("the instalment with its fee balance, payments and pay affordance", async () => {
    await authAs("GUARDIAN")
    const { GET } = await import("@/app/api/mobile/fees/invoices/[id]/route")
    const body = await (await GET(get("/invoices/inv-1"), ctx("inv-1"))).json()
    expect(body).toMatchObject({
      id: "inv-1",
      fee: { id: "fa-1", total: 200, paid: 40, remaining: 160 },
      payments: [{ id: "pay-1", receipt_number: "R-1", currency: "SDG" }],
      methods: ["bankak", "stripe"],
      can_pay_online: true,
    })
  })
})

describe("GET /api/mobile/fees/payments", () => {
  it("history, filterable by student", async () => {
    await authAs("STUDENT")
    const { GET } = await import("@/app/api/mobile/fees/payments/route")
    const body = await (await GET(get("/payments"))).json()
    expect(body).toMatchObject({ total: 1, page: 1, per_page: 20 })
    expect(body.data[0]).toEqual({
      id: "pay-1",
      fee_assignment_id: "fa-1",
      payment_number: "P-1",
      receipt_number: "R-1",
      amount: 40,
      currency: "SDG",
      payment_date: "2026-08-01T00:00:00.000Z",
      payment_method: "BANK_TRANSFER",
      status: "SUCCESS",
      fee_name: "Tuition",
      student_id: "stu-1",
      student_name: "Khadija",
      academic_year: "2026",
    })
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-2" } as never)
    const narrowed = await (await GET(get("/payments?student_id=stu-2"))).json()
    expect(narrowed.total).toBe(0)
  })
})

describe("POST /api/mobile/fees/pay", () => {
  const post = (body: unknown) =>
    new NextRequest("http://localhost/api/mobile/fees/pay", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: "Bearer test" },
    })

  it("403 for staff, 400 without fee_assignment_id", async () => {
    const { POST } = await import("@/app/api/mobile/fees/pay/route")
    await authAs("ACCOUNTANT")
    expect((await POST(post({ fee_assignment_id: "fa-1" }))).status).toBe(403)
    await authAs("GUARDIAN")
    expect((await POST(post({}))).status).toBe(400)
  })

  it("delegates to the shared checkout core as a non-admin family payer", async () => {
    await authAs("GUARDIAN")
    h.createFeeCheckoutCore.mockResolvedValue({
      status: "ok",
      checkoutUrl: "https://checkout.stripe.com/c/pay/x",
      gateway: "stripe",
      amount: 160,
      currency: "AED",
    })
    const { POST } = await import("@/app/api/mobile/fees/pay/route")
    const res = await POST(
      post({ fee_assignment_id: "fa-1", gateway: "stripe", lang: "en" })
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      checkout_url: "https://checkout.stripe.com/c/pay/x",
      gateway: "stripe",
      amount: 160,
      currency: "AED",
    })
    expect(h.createFeeCheckoutCore).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: SCHOOL,
        userId: USER,
        email: "parent@e.com",
        isFinanceAdmin: false,
        feeAssignmentId: "fa-1",
        lang: "en",
        requestedGateway: "stripe",
      })
    )
  })

  it.each([
    ["unauthorized", 403, "UNAUTHORIZED"],
    ["fullyPaid", 409, "FEE_FULLY_PAID"],
    ["gatewayUnavailable", 422, "PAYMENT_GATEWAY_UNAVAILABLE"],
    ["failed", 502, "PAYMENT_FAILED"],
  ])("maps %s to %i", async (status, http, error) => {
    await authAs("STUDENT")
    h.createFeeCheckoutCore.mockResolvedValue({ status })
    const { POST } = await import("@/app/api/mobile/fees/pay/route")
    const res = await POST(post({ fee_assignment_id: "fa-1" }))
    expect(res.status).toBe(http)
    expect(await res.json()).toEqual({ error })
  })
})
