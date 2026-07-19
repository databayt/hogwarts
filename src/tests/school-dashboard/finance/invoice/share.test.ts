// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Public share-link trio (report-card pattern): idempotent enable, token-only
// public lookup, revoke-preserves-token.
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getSharedInvoice,
  revokeInvoiceShare,
  shareInvoice,
} from "@/components/school-dashboard/finance/invoice/share"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkFinancePermission: vi.fn().mockResolvedValue(true),
}))
vi.mock("@/lib/db", () => ({
  db: {
    userInvoice: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    userInvoiceSettings: { findUnique: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))

const SCHOOL_ID = "school-1"
const TOKEN = "a".repeat(32)

function mockActor() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN", schoolId: SCHOOL_ID },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "demo",
  } as never)
}

const sharedInvoiceRow = {
  id: "inv-1",
  isPublic: true,
  schoolId: SCHOOL_ID,
  userId: "buyer-1",
  invoice_no: "I26001",
  invoice_date: new Date("2026-03-01"),
  due_date: new Date("2026-04-01"),
  currency: "SDG",
  status: "UNPAID",
  sub_total: 1000,
  discount: null,
  tax_percentage: null,
  total: 1000,
  amountPaid: 0,
  notes: null,
  shareExpiry: null,
  from: {
    name: "Hogwarts",
    email: "info@hogwarts.sd",
    address1: "Castle 1",
    address2: null,
    address3: null,
  },
  to: {
    name: "Parent",
    email: "parent@example.com",
    address1: "Home",
    address2: null,
    address3: null,
  },
  items: [
    {
      id: "it-1",
      item_name: "Tuition Fee",
      quantity: 1,
      price: 1000,
      total: 1000,
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.userInvoice.update).mockResolvedValue({} as never)
  mockActor()
})

describe("shareInvoice", () => {
  it("mints a token and flips isPublic on first share", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
      wizardStep: null,
      shareToken: null,
      isPublic: false,
    } as never)

    const result = await shareInvoice("inv-1")
    expect(result.success).toBe(true)
    if (result.success && result.data) {
      expect(result.data.token).toMatch(/^[a-f0-9]{32}$/)
    }
    expect(db.userInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPublic: true }),
      })
    )
  })

  it("is idempotent: reuses an existing public token without writing", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
      wizardStep: null,
      shareToken: TOKEN,
      isPublic: true,
    } as never)

    const result = await shareInvoice("inv-1")
    expect(result.success).toBe(true)
    if (result.success && result.data) {
      expect(result.data.token).toBe(TOKEN)
    }
    expect(db.userInvoice.update).not.toHaveBeenCalled()
  })

  it("re-enabling after revoke keeps the SAME token (no link-rot)", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
      wizardStep: null,
      shareToken: TOKEN,
      isPublic: false,
    } as never)

    const result = await shareInvoice("inv-1")
    expect(result.success).toBe(true)
    if (result.success && result.data) {
      expect(result.data.token).toBe(TOKEN)
    }
    expect(db.userInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { shareToken: TOKEN, isPublic: true },
      })
    )
  })

  it("refuses to share a draft", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
      wizardStep: "details",
      shareToken: null,
      isPublic: false,
    } as never)

    const result = await shareInvoice("inv-1")
    expect(result.success).toBe(false)
  })

  it("scopes the lookup by schoolId (cross-tenant returns not-found)", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)

    const result = await shareInvoice("other-school-invoice")
    expect(result.success).toBe(false)
    expect(db.userInvoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_ID }),
      })
    )
  })

  it("denies without invoice.edit permission", async () => {
    const { checkFinancePermission } =
      await import("@/components/school-dashboard/finance/lib/permissions")
    vi.mocked(checkFinancePermission).mockResolvedValueOnce(false)

    const result = await shareInvoice("inv-1")
    expect(result.success).toBe(false)
  })
})

describe("getSharedInvoice", () => {
  it("returns the minimal payload and bumps viewCount for a valid token", async () => {
    vi.mocked(db.userInvoice.findUnique).mockResolvedValue(
      sharedInvoiceRow as never
    )
    vi.mocked(db.userInvoiceSettings.findUnique).mockResolvedValue(null)
    vi.mocked(db.school.findUnique).mockResolvedValue({
      name: "Hogwarts",
      logoUrl: null,
      email: "info@hogwarts.sd",
    } as never)

    const result = await getSharedInvoice(TOKEN)
    expect(result.valid).toBe(true)
    expect(result.data?.invoice_no).toBe("I26001")
    expect(result.data?.items).toHaveLength(1)
    expect(db.userInvoice.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { shareToken: TOKEN },
      })
    )
    expect(db.userInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { viewCount: { increment: 1 } },
      })
    )
  })

  it("rejects an unknown token", async () => {
    vi.mocked(db.userInvoice.findUnique).mockResolvedValue(null)
    const result = await getSharedInvoice(TOKEN)
    expect(result.valid).toBe(false)
  })

  it("rejects a revoked token (isPublic false)", async () => {
    vi.mocked(db.userInvoice.findUnique).mockResolvedValue({
      ...sharedInvoiceRow,
      isPublic: false,
    } as never)
    const result = await getSharedInvoice(TOKEN)
    expect(result.valid).toBe(false)
  })

  it("rejects an expired link", async () => {
    vi.mocked(db.userInvoice.findUnique).mockResolvedValue({
      ...sharedInvoiceRow,
      shareExpiry: new Date("2020-01-01"),
    } as never)
    const result = await getSharedInvoice(TOKEN)
    expect(result.valid).toBe(false)
  })

  it("rejects a too-short token without touching the db", async () => {
    const result = await getSharedInvoice("short")
    expect(result.valid).toBe(false)
    expect(db.userInvoice.findUnique).not.toHaveBeenCalled()
  })
})

describe("revokeInvoiceShare", () => {
  it("flips isPublic off but PRESERVES the token", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
    } as never)

    const result = await revokeInvoiceShare("inv-1")
    expect(result.success).toBe(true)
    expect(db.userInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isPublic: false } })
    )
    const updateData = vi.mocked(db.userInvoice.update).mock.calls[0][0].data
    expect(updateData).not.toHaveProperty("shareToken")
  })
})
