// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { resolveSchoolLang } from "@/lib/dispatch-notification"
import { resolveAvailableMethods } from "@/lib/payment/provider"
import { checkUserRateLimit } from "@/lib/rate-limit"
import {
  acceptOffer,
  createRegistrationFeeCheckout,
  declineOffer,
  getOfferDetails,
  recordRegistrationBankTransferIntent,
  recordRegistrationCashIntent,
} from "@/components/school-marketing/application/offer/actions"
import { computeAvailableGateways } from "@/components/school-marketing/application/offer/gateways"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    application: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    feeStructure: {
      findMany: vi.fn(),
    },
    admissionSettings: {
      findUnique: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: vi.fn(),
  RATE_LIMITS: {
    AUTH: { windowMs: 60_000, maxRequests: 5 },
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn(),
  dispatchNotificationsToAudience: vi.fn(),
  resolveSchoolLang: vi.fn().mockResolvedValue("ar"),
}))

vi.mock("@/lib/payment/provider", () => ({
  createPaymentCheckout: vi.fn(),
  resolveAvailableMethods: vi.fn().mockReturnValue(["stripe"]),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("ABCDE12345"),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const APPLICATION_ID = "app-1"
const SCHOOL_ID = "school-1"
const ACCESS_TOKEN = "valid-token-abc"
const FUTURE_EXPIRY = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

function makeApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: APPLICATION_ID,
    schoolId: SCHOOL_ID,
    campaignId: "campaign-1",
    applicationNumber: "APP-001",
    firstName: "Ahmed",
    lastName: "Ali",
    applyingForClass: "Grade 1",
    status: "SELECTED",
    offerDate: new Date(),
    offerExpiryDate: FUTURE_EXPIRY,
    offerAccepted: false,
    offerAcceptedAt: null,
    registrationFeePaid: false,
    registrationFeeAmount: null,
    registrationFeeMethod: null,
    registrationFeeReference: null,
    registrationFeeDate: null,
    applicationFeePaid: false,
    admissionOffered: true,
    email: "parent@example.com",
    userId: null,
    campaign: {
      id: "campaign-1",
      name: "2025 Admissions",
      academicYear: "2025-2026",
      applicationFee: null,
    },
    ...overrides,
  }
}

const mockRL = checkUserRateLimit as ReturnType<typeof vi.fn>
const mockFindFirst = db.application.findFirst as ReturnType<typeof vi.fn>
const mockUpdate = db.application.update as ReturnType<typeof vi.fn>
const mockSchoolFindUnique = db.school.findUnique as ReturnType<typeof vi.fn>
const mockAdmissionSettingsFindUnique = db.admissionSettings
  .findUnique as ReturnType<typeof vi.fn>
const mockResolveAvailableMethods = resolveAvailableMethods as ReturnType<
  typeof vi.fn
>
const mockResolveSchoolLang = resolveSchoolLang as ReturnType<typeof vi.fn>

function allowRateLimit() {
  mockRL.mockResolvedValue({ allowed: true, remaining: 4, resetTime: 0 })
}

function blockRateLimit() {
  mockRL.mockResolvedValue({
    allowed: false,
    remaining: 0,
    resetTime: Date.now() + 60_000,
  })
}

/** Default: online payment enabled, stripe resolvable, no admin allowlist. */
function allowOnlineGateway(overrides: Record<string, unknown> = {}) {
  mockResolveAvailableMethods.mockReturnValue(["stripe"])
  mockAdmissionSettingsFindUnique.mockResolvedValue({
    enableOnlinePayment: true,
    paymentMethods: null,
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// acceptOffer
// ---------------------------------------------------------------------------

describe("acceptOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    allowRateLimit()
  })

  it("returns RATE_LIMITED when rate limit exceeded", async () => {
    blockRateLimit()
    const result = await acceptOffer(APPLICATION_ID, ACCESS_TOKEN)
    expect(result).toEqual({ success: false, error: "RATE_LIMITED" })
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it("returns APPLICATION_NOT_FOUND for unknown token", async () => {
    mockFindFirst.mockResolvedValue(null)
    const result = await acceptOffer(APPLICATION_ID, "bad-token")
    expect(result).toEqual({ success: false, error: "APPLICATION_NOT_FOUND" })
  })

  it("returns OFFER_NOT_AVAILABLE when status is not SELECTED", async () => {
    mockFindFirst.mockResolvedValue(makeApplication({ status: "PENDING" }))
    const result = await acceptOffer(APPLICATION_ID, ACCESS_TOKEN)
    expect(result).toEqual({ success: false, error: "OFFER_NOT_AVAILABLE" })
  })

  it("returns OFFER_EXPIRED when expiry date is in the past", async () => {
    mockFindFirst.mockResolvedValue(
      makeApplication({ offerExpiryDate: new Date(Date.now() - 1000) })
    )
    const result = await acceptOffer(APPLICATION_ID, ACCESS_TOKEN)
    expect(result).toEqual({ success: false, error: "OFFER_EXPIRED" })
  })

  it("returns OFFER_ALREADY_ACCEPTED when already accepted", async () => {
    mockFindFirst.mockResolvedValue(
      makeApplication({ offerAccepted: true, offerAcceptedAt: new Date() })
    )
    const result = await acceptOffer(APPLICATION_ID, ACCESS_TOKEN)
    expect(result).toEqual({ success: false, error: "OFFER_ALREADY_ACCEPTED" })
  })

  it("accepts offer and returns success with timestamp", async () => {
    mockFindFirst.mockResolvedValue(makeApplication())
    mockUpdate.mockResolvedValue({})
    const result = await acceptOffer(APPLICATION_ID, ACCESS_TOKEN)
    expect(result.success).toBe(true)
    expect(result.data?.offerAcceptedAt).toBeInstanceOf(Date)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: APPLICATION_ID, schoolId: SCHOOL_ID },
        data: expect.objectContaining({ offerAccepted: true }),
      })
    )
  })
})

// ---------------------------------------------------------------------------
// declineOffer
// ---------------------------------------------------------------------------

describe("declineOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    allowRateLimit()
  })

  it("returns RATE_LIMITED when rate limit exceeded", async () => {
    blockRateLimit()
    const result = await declineOffer(APPLICATION_ID, ACCESS_TOKEN)
    expect(result).toEqual({ success: false, error: "RATE_LIMITED" })
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it("returns OFFER_NOT_AVAILABLE when status is not SELECTED", async () => {
    mockFindFirst.mockResolvedValue(makeApplication({ status: "WITHDRAWN" }))
    const result = await declineOffer(APPLICATION_ID, ACCESS_TOKEN)
    expect(result).toEqual({ success: false, error: "OFFER_NOT_AVAILABLE" })
  })

  it("declines offer and sets status to WITHDRAWN", async () => {
    mockFindFirst.mockResolvedValue(makeApplication())
    mockUpdate.mockResolvedValue({})
    const result = await declineOffer(APPLICATION_ID, ACCESS_TOKEN)
    expect(result).toEqual({ success: true, data: { status: "WITHDRAWN" } })
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: APPLICATION_ID, schoolId: SCHOOL_ID },
        // Declining also clears offerAccepted so a withdrawn offer can't slip
        // past the offerAccepted-only gate on the payment actions.
        data: { status: "WITHDRAWN", offerAccepted: false },
      })
    )
  })
})

// ---------------------------------------------------------------------------
// createRegistrationFeeCheckout
// ---------------------------------------------------------------------------

describe("createRegistrationFeeCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    allowRateLimit()
    allowOnlineGateway()
    mockSchoolFindUnique.mockResolvedValue({ currency: "SAR", domain: "demo" })
    ;(db.class.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(db.feeStructure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      []
    )
  })

  it("returns RATE_LIMITED when rate limit exceeded", async () => {
    blockRateLimit()
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "stripe"
    )
    expect(result).toEqual({ success: false, error: "RATE_LIMITED" })
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it("returns OFFER_NOT_ACCEPTED when offer has not been accepted", async () => {
    mockFindFirst.mockResolvedValue(makeApplication({ offerAccepted: false }))
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "stripe"
    )
    expect(result).toEqual({ success: false, error: "OFFER_NOT_ACCEPTED" })
  })

  it("rejects payment for a withdrawn offer even if it was accepted", async () => {
    // Declining leaves the seat forfeited; a withdrawn offer must not be
    // payable regardless of the historical offerAccepted flag.
    mockFindFirst.mockResolvedValue(
      makeApplication({ status: "WITHDRAWN", offerAccepted: true })
    )
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "stripe"
    )
    expect(result).toEqual({ success: false, error: "OFFER_NOT_AVAILABLE" })
  })

  it("rejects payment for an expired offer", async () => {
    mockFindFirst.mockResolvedValue(
      makeApplication({ offerAccepted: true, offerExpiryDate: new Date(0) })
    )
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "stripe"
    )
    expect(result).toEqual({ success: false, error: "OFFER_EXPIRED" })
  })

  it("returns REGISTRATION_FEE_ALREADY_PAID when fee is already paid", async () => {
    mockFindFirst.mockResolvedValue(
      makeApplication({ offerAccepted: true, registrationFeePaid: true })
    )
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "stripe"
    )
    expect(result).toEqual({
      success: false,
      error: "REGISTRATION_FEE_ALREADY_PAID",
    })
  })

  it("clears stale checkout state and proceeds when method is set but unpaid", async () => {
    // Stale state: method recorded but fee not paid (abandoned checkout)
    mockFindFirst.mockResolvedValue(
      makeApplication({
        offerAccepted: true,
        registrationFeePaid: false,
        registrationFeeMethod: "stripe",
        registrationFeeReference: "REG-STALE123",
        registrationFeeAmount: 500,
      })
    )
    mockSchoolFindUnique.mockResolvedValue({
      currency: "SAR",
      domain: "demo",
    })
    mockUpdate.mockResolvedValue({})

    // createPaymentCheckout fails with NO_FEE_CONFIGURED because feeAmount=0
    // (no feeStructures mocked) — but the key assertion is that we cleared
    // the stale method and did NOT return PAYMENT_ALREADY_RECORDED.
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "stripe"
    )

    // Stale state was cleared before proceeding
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: APPLICATION_ID, schoolId: SCHOOL_ID },
        data: {
          registrationFeeMethod: null,
          registrationFeeReference: null,
          registrationFeeAmount: null,
        },
      })
    )
    // Did NOT short-circuit with PAYMENT_ALREADY_RECORDED
    expect(result.error).not.toBe("PAYMENT_ALREADY_RECORDED")
  })

  it("returns NO_FEE_CONFIGURED when calculated fee is zero", async () => {
    mockFindFirst.mockResolvedValue(makeApplication({ offerAccepted: true }))
    mockSchoolFindUnique.mockResolvedValue({ currency: "SAR", domain: "demo" })
    // No feeStructures — fee calculates to 0
    ;(db.feeStructure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      []
    )

    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "stripe"
    )
    expect(result).toEqual({ success: false, error: "NO_FEE_CONFIGURED" })
  })

  it("rejects cash as a gateway — it has its own dedicated action", async () => {
    mockFindFirst.mockResolvedValue(makeApplication({ offerAccepted: true }))
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "cash"
    )
    expect(result).toEqual({
      success: false,
      error: "PAYMENT_METHOD_NOT_AVAILABLE",
    })
  })

  it("rejects bank_transfer as a gateway — it has its own dedicated action", async () => {
    mockFindFirst.mockResolvedValue(makeApplication({ offerAccepted: true }))
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "bank_transfer"
    )
    expect(result).toEqual({
      success: false,
      error: "PAYMENT_METHOD_NOT_AVAILABLE",
    })
  })

  it("rejects a gateway not resolved for the school (e.g. unsupported currency)", async () => {
    mockFindFirst.mockResolvedValue(makeApplication({ offerAccepted: true }))
    // No online gateway resolves for this school/currency (e.g. Stripe
    // excluded because the school's currency isn't supported).
    mockResolveAvailableMethods.mockReturnValue([])
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "stripe"
    )
    expect(result).toEqual({
      success: false,
      error: "PAYMENT_METHOD_NOT_AVAILABLE",
    })
  })

  it("rejects an online gateway when the school has not enabled online payment", async () => {
    mockFindFirst.mockResolvedValue(makeApplication({ offerAccepted: true }))
    mockAdmissionSettingsFindUnique.mockResolvedValue({
      enableOnlinePayment: false,
      paymentMethods: null,
    })
    const result = await createRegistrationFeeCheckout(
      APPLICATION_ID,
      ACCESS_TOKEN,
      "en",
      "stripe"
    )
    expect(result).toEqual({
      success: false,
      error: "PAYMENT_METHOD_NOT_AVAILABLE",
    })
  })
})
