// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
// Import after mocks so the mock wiring is in place
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { updateContentFlags } from "@/components/saas-dashboard/catalog/approval-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    question: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    material: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    assignment: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    book: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    video: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    exam: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Helpers
// ============================================================================

function mockDeveloperSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "dev-1", role: "DEVELOPER" },
  } as any)
}

function mockNonDeveloperSession(role = "ADMIN") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role },
  } as any)
}

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null)
}

// ============================================================================
// Tests
// ============================================================================

describe("updateContentFlags", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // Authorization
  // --------------------------------------------------------------------------

  it("requires DEVELOPER role", async () => {
    mockNonDeveloperSession("ADMIN")

    const result = await updateContentFlags("Question", "q-1", {
      visibility: "PUBLIC",
    })

    expect(result).toEqual({
      success: false,
      error: "Unauthorized: DEVELOPER role required",
    })
    expect(db.question.update).not.toHaveBeenCalled()
  })

  it("returns error when unauthenticated", async () => {
    mockUnauthenticated()

    const result = await updateContentFlags("Question", "q-1", {
      visibility: "PUBLIC",
    })

    expect(result).toEqual({
      success: false,
      error: "Unauthorized: DEVELOPER role required",
    })
    expect(db.question.update).not.toHaveBeenCalled()
  })

  // --------------------------------------------------------------------------
  // Zod validation
  // --------------------------------------------------------------------------

  it("rejects an invalid visibility enum value", async () => {
    mockDeveloperSession()

    const result = await updateContentFlags("Question", "q-1", {
      visibility: "BOGUS" as any,
    })

    expect(result.success).toBe(false)
    expect(db.question.update).not.toHaveBeenCalled()
  })

  it("rejects an invalid status enum value", async () => {
    mockDeveloperSession()

    const result = await updateContentFlags("Question", "q-1", {
      status: "LIVE" as any,
    })

    expect(result.success).toBe(false)
    expect(db.question.update).not.toHaveBeenCalled()
  })

  it("rejects a currency that is not 3 letters", async () => {
    mockDeveloperSession()

    const result = await updateContentFlags("Question", "q-1", {
      visibility: "PAID",
      price: 5,
      currency: "DOLLARS" as any,
    })

    expect(result.success).toBe(false)
    expect(db.question.update).not.toHaveBeenCalled()
  })

  // --------------------------------------------------------------------------
  // Happy paths
  // --------------------------------------------------------------------------

  it("updates visibility for a Question (priceable -> nulls pricing on non-PAID)", async () => {
    mockDeveloperSession()
    vi.mocked(db.question.update).mockResolvedValue({} as any)

    const result = await updateContentFlags("Question", "q-1", {
      visibility: "PUBLIC",
    })

    expect(result).toEqual({ success: true })
    // Question is priceable, so switching to a non-PAID visibility clears any
    // stored price/currency.
    expect(db.question.update).toHaveBeenCalledWith({
      where: { id: "q-1" },
      data: { visibility: "PUBLIC", price: null, currency: null },
    })
  })

  it("updates visibility for a Book without touching pricing (non-priceable)", async () => {
    mockDeveloperSession()
    vi.mocked(db.book.update).mockResolvedValue({} as any)

    const result = await updateContentFlags("Book", "b-1", {
      visibility: "PUBLIC",
    })

    expect(result).toEqual({ success: true })
    expect(db.book.update).toHaveBeenCalledWith({
      where: { id: "b-1" },
      data: { visibility: "PUBLIC" },
    })
  })

  it("updates status for a Material", async () => {
    mockDeveloperSession()
    vi.mocked(db.material.update).mockResolvedValue({} as any)

    const result = await updateContentFlags("Material", "m-1", {
      status: "ARCHIVED",
    })

    expect(result).toEqual({ success: true })
    expect(db.material.update).toHaveBeenCalledWith({
      where: { id: "m-1" },
      data: { status: "ARCHIVED" },
    })
  })

  it("updates status for an Exam", async () => {
    mockDeveloperSession()
    vi.mocked(db.exam.update).mockResolvedValue({} as any)

    const result = await updateContentFlags("Exam", "e-1", {
      status: "PUBLISHED",
    })

    expect(result).toEqual({ success: true })
    expect(db.exam.update).toHaveBeenCalledWith({
      where: { id: "e-1" },
      data: { status: "PUBLISHED" },
    })
  })

  // --------------------------------------------------------------------------
  // Per-type field whitelist
  // --------------------------------------------------------------------------

  it("rejects a status update on Video (no ContentStatus column)", async () => {
    mockDeveloperSession()

    const result = await updateContentFlags("Video", "v-1", {
      status: "PUBLISHED",
    })

    expect(result).toEqual({
      success: false,
      error: "Status is not supported for this content type",
    })
    expect(db.video.update).not.toHaveBeenCalled()
  })

  it("rejects a price update on Material (no price column)", async () => {
    mockDeveloperSession()

    const result = await updateContentFlags("Material", "m-1", {
      price: 5,
    })

    expect(result).toEqual({
      success: false,
      error: "Pricing is not supported for this content type",
    })
    expect(db.material.update).not.toHaveBeenCalled()
  })

  it("rejects PAID visibility on Book (no price column)", async () => {
    mockDeveloperSession()

    const result = await updateContentFlags("Book", "b-1", {
      visibility: "PAID",
    })

    expect(result).toEqual({
      success: false,
      error: "PAID visibility is not supported for this content type",
    })
    expect(db.book.update).not.toHaveBeenCalled()
  })

  // --------------------------------------------------------------------------
  // PAID guard
  // --------------------------------------------------------------------------

  it("rejects PAID when no price is passed and none exists on the row", async () => {
    mockDeveloperSession()
    vi.mocked(db.question.findUnique).mockResolvedValue({
      price: null,
      currency: null,
    } as any)

    const result = await updateContentFlags("Question", "q-1", {
      visibility: "PAID",
    })

    expect(result).toEqual({
      success: false,
      error: "Paid content requires a price and 3-letter currency",
    })
    expect(db.question.findUnique).toHaveBeenCalledWith({
      where: { id: "q-1" },
      select: { price: true, currency: true },
    })
    expect(db.question.update).not.toHaveBeenCalled()
  })

  it("uses the existing row price when PAID is set without an explicit price", async () => {
    mockDeveloperSession()
    // Question.price is a Prisma Decimal -- represented here as a number; the
    // action calls Number() on it.
    vi.mocked(db.question.findUnique).mockResolvedValue({
      price: 12.5,
      currency: "EUR",
    } as any)
    vi.mocked(db.question.update).mockResolvedValue({} as any)

    const result = await updateContentFlags("Question", "q-1", {
      visibility: "PAID",
    })

    expect(result).toEqual({ success: true })
    expect(db.question.update).toHaveBeenCalledWith({
      where: { id: "q-1" },
      data: {
        visibility: "PAID",
        price: 12.5,
        currency: "EUR",
      },
    })
  })

  it("writes a PAID price + uppercased currency for Video", async () => {
    mockDeveloperSession()
    vi.mocked(db.video.update).mockResolvedValue({} as any)

    const result = await updateContentFlags("Video", "v-1", {
      visibility: "PAID",
      price: 4.5,
      currency: "sar",
    })

    expect(result).toEqual({ success: true })
    // findUnique is NOT needed when price + currency are supplied.
    expect(db.video.findUnique).not.toHaveBeenCalled()
    expect(db.video.update).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: {
        visibility: "PAID",
        price: 4.5,
        currency: "SAR",
      },
    })
  })

  // --------------------------------------------------------------------------
  // Non-PAID nulls price for priceable types
  // --------------------------------------------------------------------------

  it("nulls price + currency when visibility moves to a non-PAID value (Question)", async () => {
    mockDeveloperSession()
    vi.mocked(db.question.update).mockResolvedValue({} as any)

    const result = await updateContentFlags("Question", "q-1", {
      visibility: "PUBLIC",
    })

    expect(result).toEqual({ success: true })
    expect(db.question.update).toHaveBeenCalledWith({
      where: { id: "q-1" },
      data: {
        visibility: "PUBLIC",
        price: null,
        currency: null,
      },
    })
  })

  it("nulls price + currency when visibility moves to non-PAID (Video)", async () => {
    mockDeveloperSession()
    vi.mocked(db.video.update).mockResolvedValue({} as any)

    const result = await updateContentFlags("Video", "v-1", {
      visibility: "SCHOOL",
    })

    expect(result).toEqual({ success: true })
    expect(db.video.update).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: {
        visibility: "SCHOOL",
        price: null,
        currency: null,
      },
    })
  })

  // --------------------------------------------------------------------------
  // Revalidation + misc
  // --------------------------------------------------------------------------

  it("revalidates the approvals + tab paths after a successful update", async () => {
    mockDeveloperSession()
    vi.mocked(db.assignment.update).mockResolvedValue({} as any)

    const result = await updateContentFlags("Assignment", "a-1", {
      status: "ARCHIVED",
    })

    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith("/catalog/approvals")
    expect(revalidatePath).toHaveBeenCalledWith("/catalog/assignments")
  })

  it("returns an error when no flags are provided", async () => {
    mockDeveloperSession()

    const result = await updateContentFlags("Question", "q-1", {})

    expect(result).toEqual({ success: false, error: "No flags to update" })
    expect(db.question.update).not.toHaveBeenCalled()
  })

  it("returns an error when the database update fails", async () => {
    mockDeveloperSession()
    vi.mocked(db.question.update).mockRejectedValue(
      new Error("Record not found")
    )

    const result = await updateContentFlags("Question", "q-1", {
      visibility: "PUBLIC",
    })

    expect(result).toEqual({ success: false, error: "Record not found" })
  })
})
