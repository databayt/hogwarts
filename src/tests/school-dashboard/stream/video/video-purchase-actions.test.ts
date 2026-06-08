// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { checkUserRateLimit } from "@/lib/rate-limit"
import { stripe } from "@/lib/stripe"
import { getTenantContext } from "@/lib/tenant-context"
import { purchaseVideo } from "@/components/stream/video/video-purchase-actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: vi.fn(),
  RATE_LIMITS: { STREAM_ENROLLMENT: { windowMs: 60000, maxRequests: 5 } },
}))
vi.mock("next/headers", () => ({
  headers: vi
    .fn()
    .mockResolvedValue({ get: () => "http://localhost:3000/en/stream" }),
}))
vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
}))
vi.mock("@/lib/db", () => ({
  db: {
    video: { findUnique: vi.fn() },
    videoPurchase: { findUnique: vi.fn(), upsert: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockRL = checkUserRateLimit as ReturnType<typeof vi.fn>
const mVideo = db.video.findUnique as ReturnType<typeof vi.fn>
const mExisting = db.videoPurchase.findUnique as ReturnType<typeof vi.fn>
const mUpsert = db.videoPurchase.upsert as ReturnType<typeof vi.fn>
const mUser = db.user.findUnique as ReturnType<typeof vi.fn>
const mCustomerCreate = stripe!.customers.create as unknown as ReturnType<
  typeof vi.fn
>
const mCheckoutCreate = stripe!.checkout.sessions
  .create as unknown as ReturnType<typeof vi.fn>

const PAID_VIDEO = {
  id: "vid-1",
  title: "Paid Lesson",
  price: 19.99,
  currency: "USD",
  visibility: "PAID",
  approvalStatus: "APPROVED",
  catalogLessonId: "lesson-1",
  lesson: { chapter: { subject: { slug: "math" } } },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: "user-1" } })
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockRL.mockResolvedValue({ allowed: true, remaining: 4, resetTime: 0 })
  mVideo.mockResolvedValue(PAID_VIDEO)
  mExisting.mockResolvedValue(null)
  mUser.mockResolvedValue({
    stripeCustomerId: "cus_1",
    email: "s@x.com",
    username: "stu",
  })
  mUpsert.mockResolvedValue({})
  mCheckoutCreate.mockResolvedValue({
    id: "cs_1",
    url: "https://stripe/checkout",
  })
})

describe("purchaseVideo — guards", () => {
  it("rejects unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const r = await purchaseVideo("vid-1")
    expect(r.status).toBe("error")
    expect(mCheckoutCreate).not.toHaveBeenCalled()
  })

  it("rejects when rate limited (before any Stripe call)", async () => {
    mockRL.mockResolvedValueOnce({ allowed: false, remaining: 0, resetTime: 0 })
    const r = await purchaseVideo("vid-1")
    expect(r.status).toBe("error")
    expect(mVideo).not.toHaveBeenCalled()
    expect(mCheckoutCreate).not.toHaveBeenCalled()
  })

  it("rejects a missing video", async () => {
    mVideo.mockResolvedValueOnce(null)
    const r = await purchaseVideo("vid-1")
    expect(r.status).toBe("error")
  })

  it("rejects a non-APPROVED or non-PAID video", async () => {
    mVideo.mockResolvedValueOnce({ ...PAID_VIDEO, approvalStatus: "PENDING" })
    expect((await purchaseVideo("vid-1")).status).toBe("error")
    mVideo.mockResolvedValueOnce({ ...PAID_VIDEO, visibility: "SCHOOL" })
    expect((await purchaseVideo("vid-1")).status).toBe("error")
  })

  it("rejects incomplete pricing (price <= 0 or missing currency)", async () => {
    mVideo.mockResolvedValueOnce({ ...PAID_VIDEO, price: 0 })
    expect((await purchaseVideo("vid-1")).status).toBe("error")
    mVideo.mockResolvedValueOnce({ ...PAID_VIDEO, currency: null })
    expect((await purchaseVideo("vid-1")).status).toBe("error")
  })

  it("rejects re-purchase when already owned (SUCCESS)", async () => {
    mExisting.mockResolvedValueOnce({ status: "SUCCESS" })
    const r = await purchaseVideo("vid-1")
    expect(r.status).toBe("error")
    expect(mCheckoutCreate).not.toHaveBeenCalled()
  })
})

describe("purchaseVideo — checkout", () => {
  it("creates a checkout with unit_amount in integer cents and upserts PENDING", async () => {
    const r = await purchaseVideo("vid-1")

    expect(r.status).toBe("success")
    expect(r.checkoutUrl).toBe("https://stripe/checkout")

    // Price comes from the DB, converted to integer cents (no client trust).
    const checkoutArg = mCheckoutCreate.mock.calls[0][0] as any
    expect(checkoutArg.line_items[0].price_data.unit_amount).toBe(1999)
    expect(checkoutArg.line_items[0].price_data.currency).toBe("usd")
    expect(checkoutArg.metadata).toEqual(
      expect.objectContaining({
        userId: "user-1",
        videoId: "vid-1",
        type: "video_purchase",
        schoolId: "school-1",
      })
    )

    // A PENDING row is written so the admin UI can see the intent pre-webhook.
    expect(mUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_videoId: { userId: "user-1", videoId: "vid-1" } },
        create: expect.objectContaining({
          status: "PENDING",
          amount: 19.99,
          currency: "USD",
          schoolId: "school-1",
        }),
      })
    )
  })
})
