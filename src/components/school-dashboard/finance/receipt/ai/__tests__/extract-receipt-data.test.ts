// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  extractReceiptData,
  retryExtraction,
} from "../extract-receipt-data"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    expenseReceipt: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "model"),
}))

const generateObject = vi.fn()
vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObject(...args),
}))

const SCHOOL_A = "school-a"
const OTHER_SCHOOL = "school-b"
const RECEIPT_ID = "receipt-1"

function mockExtractedObject() {
  generateObject.mockResolvedValue({
    object: {
      merchantName: "ACME",
      merchantAddress: "1 St",
      merchantContact: "x",
      transactionDate: "2026-01-01",
      transactionAmount: "100.00",
      currency: "USD",
      receiptSummary: "summary",
      items: [],
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("extractReceiptData — tenant isolation", () => {
  it("aborts WITHOUT an AI call when the receipt belongs to another school (claim count 0)", async () => {
    // updateMany scoped by {id, schoolId} matches nothing → count 0.
    vi.mocked(db.expenseReceipt.updateMany).mockResolvedValue({ count: 0 })

    const result = await extractReceiptData(RECEIPT_ID, "http://f", OTHER_SCHOOL)

    expect(result.success).toBe(false)
    // The whole point: no money spent on another tenant's receipt.
    expect(generateObject).not.toHaveBeenCalled()
    // The claim was scoped by BOTH id and schoolId.
    expect(db.expenseReceipt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: RECEIPT_ID, schoolId: OTHER_SCHOOL },
        data: { status: "processing" },
      })
    )
  })

  it("processes and writes back scoped by {id, schoolId} when owned", async () => {
    vi.mocked(db.expenseReceipt.updateMany).mockResolvedValue({ count: 1 })
    mockExtractedObject()

    const result = await extractReceiptData(RECEIPT_ID, "http://f", SCHOOL_A)

    expect(result.success).toBe(true)
    expect(generateObject).toHaveBeenCalledTimes(1)
    // Every write — claim + data write — is schoolId-scoped.
    for (const call of vi.mocked(db.expenseReceipt.updateMany).mock.calls) {
      expect(call[0].where).toMatchObject({
        id: RECEIPT_ID,
        schoolId: SCHOOL_A,
      })
    }
  })

  it("marks error scoped by {id, schoolId} when extraction throws", async () => {
    vi.mocked(db.expenseReceipt.updateMany).mockResolvedValue({ count: 1 })
    generateObject.mockRejectedValue(new Error("AI down"))

    const result = await extractReceiptData(RECEIPT_ID, "http://f", SCHOOL_A)

    expect(result.success).toBe(false)
    // The error-status write is also tenant-scoped.
    const lastCall = vi.mocked(db.expenseReceipt.updateMany).mock.calls.at(-1)
    expect(lastCall?.[0]).toMatchObject({
      where: { id: RECEIPT_ID, schoolId: SCHOOL_A },
      data: { status: "error" },
    })
  })
})

describe("retryExtraction — tenant isolation", () => {
  it("looks the receipt up scoped by {id, schoolId} and refuses cross-tenant", async () => {
    vi.mocked(db.expenseReceipt.findFirst).mockResolvedValue(null)

    const result = await retryExtraction(RECEIPT_ID, OTHER_SCHOOL)

    expect(result.success).toBe(false)
    expect(db.expenseReceipt.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: RECEIPT_ID, schoolId: OTHER_SCHOOL },
      })
    )
    // Never proceeds to an AI call for a receipt it could not find in-tenant.
    expect(generateObject).not.toHaveBeenCalled()
  })
})
