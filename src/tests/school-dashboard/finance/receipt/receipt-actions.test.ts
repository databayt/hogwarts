// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for receipt/actions.ts
 *
 * Covers:
 * - R-P0-1: pre-upload CDN path (fileId+fileUrl) vs legacy file path
 * - R-P2-1: revalidatePath uses correct school-dashboard route
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  deleteReceipt,
  retryReceiptExtraction,
  uploadReceipt,
} from "@/components/school-dashboard/finance/receipt/actions"

// Hoist revalidatePathMock so the vi.mock factory can reference it before
// the variable is initialised (vi.mock calls are hoisted to the top of the
// module by the vitest transform).
const { revalidatePathMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    expenseReceipt: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@/components/file", () => ({
  getProvider: vi.fn(() => ({
    upload: vi.fn().mockResolvedValue("https://cdn.example.com/file.pdf"),
    delete: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock(
  "@/components/school-dashboard/finance/receipt/ai/extract-receipt-data",
  () => ({
    extractReceiptData: vi.fn(),
    retryExtraction: vi.fn(),
  })
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockSession = {
  user: { id: "user-1", role: "ADMIN" },
}
const mockTenant = { schoolId: "school-1", subdomain: "demo" }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue(mockSession as any)
  vi.mocked(getTenantContext).mockResolvedValue(mockTenant as any)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("uploadReceipt — pre-upload CDN path (R-P0-1)", () => {
  it("creates DB record using fileUrl from CDN pre-upload (fileId+fileUrl keys)", async () => {
    const createdReceipt = { id: "receipt-1" }
    vi.mocked(db.expenseReceipt.create).mockResolvedValue(createdReceipt as any)

    const formData = new FormData()
    formData.append("fileId", "cdn-file-id-abc")
    formData.append("fileUrl", "https://cdn.example.com/receipt.pdf")

    const result = await uploadReceipt(formData)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data?.receiptId).toBe("receipt-1")
    }
    // DB create must be called with the CDN URL, not re-upload
    expect(db.expenseReceipt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: "school-1",
          fileUrl: "https://cdn.example.com/receipt.pdf",
          status: "pending",
        }),
      })
    )
  })

  it("revalidates the correct school-dashboard route (R-P2-1)", async () => {
    vi.mocked(db.expenseReceipt.create).mockResolvedValue({
      id: "receipt-2",
    } as any)

    const formData = new FormData()
    formData.append("fileId", "cdn-id")
    formData.append("fileUrl", "https://cdn.example.com/r.pdf")

    await uploadReceipt(formData)

    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/s/[subdomain]/(school-dashboard)/finance/receipt"
    )
    // Must NOT use the old wrong platform route
    expect(revalidatePathMock).not.toHaveBeenCalledWith(
      expect.stringContaining("(platform)")
    )
  })

  it("returns VALIDATION_ERROR when neither file nor fileId+fileUrl is provided", async () => {
    const formData = new FormData()
    const result = await uploadReceipt(formData)
    expect(result.success).toBe(false)
  })
})

describe("deleteReceipt — revalidatePath (R-P2-1)", () => {
  it("revalidates the correct school-dashboard route on delete", async () => {
    vi.mocked(db.expenseReceipt.findFirst).mockResolvedValue({
      id: "receipt-1",
      schoolId: "school-1",
      userId: "user-1", // owner path — non-owners now need receipt/* grants
      fileUrl: "https://cdn.example.com/r.pdf",
    } as any)
    vi.mocked(db.expenseReceipt.deleteMany).mockResolvedValue({ count: 1 })

    await deleteReceipt("receipt-1")

    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/s/[subdomain]/(school-dashboard)/finance/receipt"
    )
    expect(revalidatePathMock).not.toHaveBeenCalledWith(
      expect.stringContaining("(platform)")
    )
  })
})

describe("retryReceiptExtraction — revalidatePath (R-P2-1)", () => {
  it("revalidates correct routes on retry", async () => {
    vi.mocked(db.expenseReceipt.findFirst).mockResolvedValue({
      id: "receipt-1",
      schoolId: "school-1",
      userId: "user-1", // owner path — non-owners now need receipt/* grants
      fileUrl: "https://cdn.example.com/r.pdf",
    } as any)

    await retryReceiptExtraction("receipt-1")

    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/s/[subdomain]/(school-dashboard)/finance/receipt"
    )
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/s/[subdomain]/(school-dashboard)/finance/receipt/receipt-1"
    )
    expect(revalidatePathMock).not.toHaveBeenCalledWith(
      expect.stringContaining("(platform)")
    )
  })
})
