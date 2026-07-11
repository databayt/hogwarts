"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import {
  dispatchNotification,
  dispatchNotificationsToAudience,
  resolveSchoolLang,
} from "@/lib/dispatch-notification"
import { extractGradeNumber } from "@/lib/grade-utils"
import { toSmallestUnit } from "@/lib/payment/currency"
import { createPaymentCheckout } from "@/lib/payment/provider"
import type { PaymentCheckoutResult, PaymentGateway } from "@/lib/payment/types"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

import { computeAvailableGateways } from "./gateways"

// ============================================================================
// Types
// ============================================================================

/**
 * Discriminates a valid-token offer view from a bare fetch error.
 * - "active": SELECTED and not expired — the normal accept/pay flow.
 * - "declined": applicant withdrew (status moved to WITHDRAWN).
 * - "expired": SELECTED but past offerExpiryDate.
 * - "already_enrolled": school confirmed enrollment (status ADMITTED).
 * Applications that never reached an offer at all (still under review,
 * rejected, waitlisted, draft, ...) are NOT covered here — those remain a
 * bare `{ success: false, error: "OFFER_NOT_AVAILABLE" }` (true 404).
 */
export type OfferState = "active" | "declined" | "expired" | "already_enrolled"

export interface OfferDetails {
  offerState: OfferState
  application: {
    id: string
    applicationNumber: string
    firstName: string
    lastName: string
    applyingForClass: string
    status: string
    offerDate: Date | null
    offerExpiryDate: Date | null
    offerAccepted: boolean
    offerAcceptedAt: Date | null
    registrationFeePaid: boolean
    registrationFeeAmount: number | null
    registrationFeeMethod: string | null
    registrationFeeReference: string | null
    registrationFeeDate: Date | null
    applicationFeePaid: boolean
  }
  school: {
    id: string
    name: string
    nameEn: string | null
    address: string | null
    currency: string
  }
  campaign: {
    id: string
    name: string
    academicYear: string
    applicationFee: number | null
  }
  feeSchedulePreview: {
    id: string
    name: string
    tuitionFee: number
    admissionFee: number | null
    registrationFee: number | null
    totalAmount: number
    installments: number
  }[]
  registrationFeeTotal: number
  /** Gateways the applicant may pay the registration fee with, in priority order. */
  availableGateways: PaymentGateway[]
}

// ============================================================================
// Bilingual Notification Messages
// ============================================================================

const NOTIF = {
  offerAccepted: {
    title: {
      ar: "قبول عرض القبول",
      en: "Offer Accepted",
    },
    body: (name: string) => ({
      ar: `قام ولي أمر ${name} بقبول عرض القبول`,
      en: `The parent/guardian of ${name} has accepted the admission offer`,
    }),
  },
  offerDeclined: {
    title: {
      ar: "رفض عرض القبول",
      en: "Offer Declined",
    },
    body: (name: string) => ({
      ar: `قام ولي أمر ${name} برفض عرض القبول وسحب الطلب`,
      en: `The parent/guardian of ${name} has declined the offer and withdrawn the application`,
    }),
  },
  registrationFeePaid: {
    title: {
      ar: "دفع رسوم التسجيل",
      en: "Registration Fee Paid",
    },
    body: (name: string, method: string) => ({
      ar: `تم تسجيل دفع رسوم التسجيل للطالب ${name} عبر ${method}`,
      en: `Registration fee payment recorded for ${name} via ${method}`,
    }),
  },
} as const

const t = (msg: { ar: string; en: string }, lang: string) =>
  lang === "en" ? msg.en : msg.ar

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate access token and return the application with school info.
 * Used by all public-facing offer actions.
 */
async function validateAccessToken(applicationId: string, accessToken: string) {
  if (!accessToken || !applicationId) {
    return { error: "APPLICATION_NOT_FOUND" as const }
  }

  const application = await db.application.findFirst({
    where: { id: applicationId, accessToken },
    select: {
      id: true,
      schoolId: true,
      campaignId: true,
      applicationNumber: true,
      firstName: true,
      lastName: true,
      applyingForClass: true,
      status: true,
      offerDate: true,
      offerExpiryDate: true,
      offerAccepted: true,
      offerAcceptedAt: true,
      registrationFeePaid: true,
      registrationFeeAmount: true,
      registrationFeeMethod: true,
      registrationFeeReference: true,
      registrationFeeDate: true,
      applicationFeePaid: true,
      admissionOffered: true,
      email: true,
      userId: true,
      campaign: {
        select: {
          id: true,
          name: true,
          academicYear: true,
          applicationFee: true,
        },
      },
    },
  })

  if (!application) {
    return { error: "APPLICATION_NOT_FOUND" as const }
  }

  return { application }
}

/**
 * Check if the offer has expired.
 */
function isOfferExpired(offerExpiryDate: Date | null): boolean {
  if (!offerExpiryDate) return false
  return new Date() > offerExpiryDate
}

/**
 * Calculate the registration fee amount from FeeStructure records.
 * Falls back to campaign applicationFee if no structure-level fees exist.
 */
async function getGradeClassIds(
  schoolId: string,
  applyingForClass: string
): Promise<string[]> {
  const gradeNumber = extractGradeNumber(applyingForClass)
  if (!gradeNumber) return []

  const matchingClasses = await db.class.findMany({
    where: {
      schoolId,
      grade: { gradeNumber },
    },
    select: { id: true },
  })
  return matchingClasses.map((c) => c.id)
}

async function calculateRegistrationFee(
  schoolId: string,
  academicYear: string,
  applyingForClass: string,
  campaignApplicationFee: number | null
): Promise<number> {
  const gradeClassIds = await getGradeClassIds(schoolId, applyingForClass)

  // Find matching FeeStructure records
  const feeStructures = await db.feeStructure.findMany({
    where: {
      schoolId,
      academicYear,
      isActive: true,
      OR: [
        { classId: null },
        ...(gradeClassIds.length > 0
          ? [{ classId: { in: gradeClassIds } }]
          : []),
      ],
    },
    select: {
      registrationFee: true,
      admissionFee: true,
    },
  })

  // Sum registration + admission fees from all matching structures
  let total = 0
  for (const fs of feeStructures) {
    if (fs.registrationFee) total += Number(fs.registrationFee)
    if (fs.admissionFee) total += Number(fs.admissionFee)
  }

  // Fallback to campaign application fee if no structure-level fees
  if (total <= 0 && campaignApplicationFee) {
    return Number(campaignApplicationFee)
  }

  return total
}

/**
 * Build the base URL for a school subdomain.
 */
function getBaseUrl(subdomain: string): string {
  const isProd = process.env.NODE_ENV === "production"
  return isProd
    ? `https://${subdomain}.databayt.org`
    : `http://${subdomain}.localhost:3000`
}

// ============================================================================
// 1. Get Offer Details
// ============================================================================

/**
 * Get full offer details for the parent/guardian offer acceptance portal.
 * Public-facing: uses accessToken instead of auth().
 */
export async function getOfferDetails(
  applicationId: string,
  accessToken: string
): Promise<ActionResponse<OfferDetails>> {
  try {
    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Determine the offer's state from a valid token. WITHDRAWN (declined)
    // and ADMITTED (already enrolled) are valid, non-active outcomes with
    // their own friendly card in OfferContent — only applications that never
    // reached an offer at all (still under review, rejected, waitlisted, ...)
    // stay a true 404.
    let offerState: OfferState
    if (application.status === "WITHDRAWN") {
      offerState = "declined"
    } else if (application.status === "ADMITTED") {
      offerState = "already_enrolled"
    } else if (application.status !== "SELECTED") {
      return { success: false, error: "OFFER_NOT_AVAILABLE" }
    } else if (isOfferExpired(application.offerExpiryDate)) {
      offerState = "expired"
    } else {
      offerState = "active"
    }

    const schoolId = application.schoolId

    // Fetch school info
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        nameEn: true,
        address: true,
        currency: true,
        country: true,
        timezone: true,
      },
    })

    if (!school) {
      return { success: false, error: "SCHOOL_NOT_FOUND" }
    }

    // Resolve which gateways the applicant may pay the registration fee with.
    const admissionSettings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: { enableOnlinePayment: true, paymentMethods: true },
    })
    const availableGateways = computeAvailableGateways(
      school.country,
      school.timezone,
      school.currency ?? "USD",
      admissionSettings
    )

    // Fetch fee schedule preview
    const gradeClassIds = await getGradeClassIds(
      schoolId,
      application.applyingForClass
    )
    const feeStructures = await db.feeStructure.findMany({
      where: {
        schoolId,
        academicYear: application.campaign.academicYear,
        isActive: true,
        OR: [
          { classId: null },
          ...(gradeClassIds.length > 0
            ? [{ classId: { in: gradeClassIds } }]
            : []),
        ],
      },
      select: {
        id: true,
        name: true,
        tuitionFee: true,
        admissionFee: true,
        registrationFee: true,
        totalAmount: true,
        installments: true,
      },
    })

    // Calculate registration fee total
    const registrationFeeTotal = await calculateRegistrationFee(
      schoolId,
      application.campaign.academicYear,
      application.applyingForClass,
      application.campaign.applicationFee
        ? Number(application.campaign.applicationFee)
        : null
    )

    return {
      success: true,
      data: {
        offerState,
        application: {
          id: application.id,
          applicationNumber: application.applicationNumber,
          firstName: application.firstName,
          lastName: application.lastName,
          applyingForClass: application.applyingForClass,
          status: application.status,
          offerDate: application.offerDate,
          offerExpiryDate: application.offerExpiryDate,
          offerAccepted: application.offerAccepted,
          offerAcceptedAt: application.offerAcceptedAt,
          registrationFeePaid: application.registrationFeePaid,
          registrationFeeAmount: application.registrationFeeAmount
            ? Number(application.registrationFeeAmount)
            : null,
          registrationFeeMethod: application.registrationFeeMethod,
          registrationFeeReference: application.registrationFeeReference,
          registrationFeeDate: application.registrationFeeDate,
          applicationFeePaid: application.applicationFeePaid,
        },
        school: {
          id: school.id,
          name: school.name,
          nameEn: school.nameEn ?? null,
          address: school.address,
          currency: school.currency ?? "USD",
        },
        campaign: {
          id: application.campaign.id,
          name: application.campaign.name,
          academicYear: application.campaign.academicYear,
          applicationFee: application.campaign.applicationFee
            ? Number(application.campaign.applicationFee)
            : null,
        },
        feeSchedulePreview: feeStructures.map((fs) => ({
          id: fs.id,
          name: fs.name,
          tuitionFee: Number(fs.tuitionFee),
          admissionFee: fs.admissionFee ? Number(fs.admissionFee) : null,
          registrationFee: fs.registrationFee
            ? Number(fs.registrationFee)
            : null,
          totalAmount: Number(fs.totalAmount),
          installments: fs.installments,
        })),
        registrationFeeTotal,
        availableGateways,
      },
    }
  } catch (error) {
    console.error("[getOfferDetails]", error)
    return { success: false, error: "OFFER_FETCH_FAILED" }
  }
}

// ============================================================================
// 2. Accept Offer
// ============================================================================

/**
 * Parent/guardian accepts the admission offer.
 * Sets offerAccepted = true and notifies school admins.
 */
export async function acceptOffer(
  applicationId: string,
  accessToken: string
): Promise<ActionResponse<{ offerAcceptedAt: Date }>> {
  try {
    // Rate limit: 5 accept attempts per minute per token (prevents retry storms)
    const rl = await checkUserRateLimit(
      `offer-accept:${accessToken}`,
      RATE_LIMITS.AUTH,
      "offer-accept"
    )
    if (!rl.allowed) {
      return { success: false, error: "RATE_LIMITED" }
    }

    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Must be SELECTED
    if (application.status !== "SELECTED") {
      return { success: false, error: "OFFER_NOT_AVAILABLE" }
    }

    // Check expiry
    if (isOfferExpired(application.offerExpiryDate)) {
      return { success: false, error: "OFFER_EXPIRED" }
    }

    // Already accepted
    if (application.offerAccepted) {
      return { success: false, error: "OFFER_ALREADY_ACCEPTED" }
    }

    const now = new Date()
    const applicantName = `${application.firstName} ${application.lastName}`

    // Resolve the school's notification language once — run alongside the
    // write since neither depends on the other's result.
    const [, lang] = await Promise.all([
      db.application.update({
        where: { id: applicationId, schoolId: application.schoolId },
        data: {
          offerAccepted: true,
          offerAcceptedAt: now,
        },
      }),
      resolveSchoolLang(application.schoolId),
    ])

    // Notify school admins — once, in the school's own language (previously
    // dispatched twice, ar then en, spamming admins with a duplicate in a
    // language their school doesn't use).
    await dispatchNotificationsToAudience({
      schoolId: application.schoolId,
      type: "system_alert",
      title: t(NOTIF.offerAccepted.title, lang),
      body: t(NOTIF.offerAccepted.body(applicantName), lang),
      lang,
      priority: "high",
      targetScope: "role",
      targetRole: "ADMIN",
      metadata: {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        action: "offer_accepted",
      },
    })

    // Notify the applicant's user account if linked
    if (application.userId) {
      await dispatchNotification({
        schoolId: application.schoolId,
        userId: application.userId,
        type: "system_alert",
        title: t(NOTIF.offerAccepted.title, lang),
        body: t(NOTIF.offerAccepted.body(applicantName), lang),
        lang,
      })
    }

    revalidatePath("/application")

    return {
      success: true,
      data: { offerAcceptedAt: now },
    }
  } catch (error) {
    console.error("[acceptOffer]", error)
    return { success: false, error: "OFFER_ACCEPT_FAILED" }
  }
}

// ============================================================================
// 3. Decline Offer
// ============================================================================

/**
 * Parent/guardian declines the admission offer.
 * Changes status to WITHDRAWN and notifies school admins.
 */
export async function declineOffer(
  applicationId: string,
  accessToken: string
): Promise<ActionResponse<{ status: string }>> {
  try {
    // Rate limit: 5 decline attempts per minute per token
    const rl = await checkUserRateLimit(
      `offer-decline:${accessToken}`,
      RATE_LIMITS.AUTH,
      "offer-decline"
    )
    if (!rl.allowed) {
      return { success: false, error: "RATE_LIMITED" }
    }

    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Must be SELECTED
    if (application.status !== "SELECTED") {
      return { success: false, error: "OFFER_NOT_AVAILABLE" }
    }

    // Once the registration fee is paid the seat is committed — declining would
    // strand a real payment. Block it and let the school handle a refund.
    if (application.registrationFeePaid) {
      return { success: false, error: "REGISTRATION_FEE_ALREADY_PAID" }
    }

    const applicantName = `${application.firstName} ${application.lastName}`

    // Resolve the school's notification language once — run alongside the
    // write since neither depends on the other's result.
    const [, lang] = await Promise.all([
      db.application.update({
        where: { id: applicationId, schoolId: application.schoolId },
        data: {
          status: "WITHDRAWN",
          // Clear acceptance so a withdrawn offer can't slip past the
          // offerAccepted-only gates on the payment actions.
          offerAccepted: false,
        },
      }),
      resolveSchoolLang(application.schoolId),
    ])

    // Notify school admins — once, in the school's own language (previously
    // dispatched twice, ar then en, spamming admins with a duplicate in a
    // language their school doesn't use).
    await dispatchNotificationsToAudience({
      schoolId: application.schoolId,
      type: "system_alert",
      title: t(NOTIF.offerDeclined.title, lang),
      body: t(NOTIF.offerDeclined.body(applicantName), lang),
      lang,
      priority: "high",
      targetScope: "role",
      targetRole: "ADMIN",
      metadata: {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        action: "offer_declined",
      },
    })

    // Notify the applicant's user account if linked
    if (application.userId) {
      await dispatchNotification({
        schoolId: application.schoolId,
        userId: application.userId,
        type: "system_alert",
        title: t(NOTIF.offerDeclined.title, lang),
        body: t(NOTIF.offerDeclined.body(applicantName), lang),
        lang,
      })
    }

    revalidatePath("/application")

    return {
      success: true,
      data: { status: "WITHDRAWN" },
    }
  } catch (error) {
    console.error("[declineOffer]", error)
    return { success: false, error: "OFFER_DECLINE_FAILED" }
  }
}

// ============================================================================
// 4. Create Registration Fee Checkout (Stripe)
// ============================================================================

/**
 * Create a Stripe checkout session for the registration fee.
 * Only works after the parent has accepted the offer.
 */
export async function createRegistrationFeeCheckout(
  applicationId: string,
  accessToken: string,
  locale: string,
  gateway: PaymentGateway
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    // Rate limit: 5 checkout attempts per minute per token (each attempt
    // creates a Stripe session — cap abuse and accidental retry storms).
    const rl = await checkUserRateLimit(
      `reg-checkout:${accessToken}`,
      RATE_LIMITS.AUTH,
      "reg-checkout"
    )
    if (!rl.allowed) {
      return { success: false, error: "RATE_LIMITED" }
    }

    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Offer must still be live: a WITHDRAWN/declined or expired offer must not
    // be payable (declining leaves offerAccepted untouched, so this status gate
    // is what actually blocks paying a withdrawn offer).
    if (application.status !== "SELECTED") {
      return { success: false, error: "OFFER_NOT_AVAILABLE" }
    }
    if (isOfferExpired(application.offerExpiryDate)) {
      return { success: false, error: "OFFER_EXPIRED" }
    }

    // Must have accepted the offer first
    if (!application.offerAccepted) {
      return { success: false, error: "OFFER_NOT_ACCEPTED" }
    }

    // Already paid — hard block
    if (application.registrationFeePaid) {
      return { success: false, error: "REGISTRATION_FEE_ALREADY_PAID" }
    }

    // Stale checkout state: registrationFeeMethod is set but unpaid (e.g. the
    // parent started a Stripe checkout, abandoned it, and is retrying).
    // Clear the stale method so a fresh checkout session can be created.
    // The webhook-side idempotency handles any race where the old session
    // completes concurrently (it simply marks paid on the correct reference).
    if (application.registrationFeeMethod && !application.registrationFeePaid) {
      await db.application.update({
        where: { id: applicationId, schoolId: application.schoolId },
        data: {
          registrationFeeMethod: null,
          registrationFeeReference: null,
          registrationFeeAmount: null,
        },
      })
      // Reflect the cleared state in our local copy so the rest of the
      // function proceeds as if no method was ever recorded.
      application.registrationFeeMethod = null
    }

    const schoolId = application.schoolId

    // Get school details for currency + gateway resolution
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        currency: true,
        domain: true,
        country: true,
        timezone: true,
      },
    })

    if (!school) {
      return { success: false, error: "SCHOOL_NOT_FOUND" }
    }

    const currency = school.currency ?? "USD"

    // Validate the requested gateway against what's actually available for
    // this school — never trust the client-supplied gateway blindly. This is
    // also what stops a Sudan school's "Pay Card" from ever reaching Stripe:
    // Stripe isn't in SD's resolved gateway list, so it fails here instead of
    // erroring inside Stripe on an unsupported SDG charge. cash/bank_transfer
    // have their own dedicated actions — reject them here.
    if (gateway === "cash" || gateway === "bank_transfer") {
      return { success: false, error: "PAYMENT_METHOD_NOT_AVAILABLE" }
    }
    const admissionSettings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: { enableOnlinePayment: true, paymentMethods: true },
    })
    const availableGateways = computeAvailableGateways(
      school.country,
      school.timezone,
      currency,
      admissionSettings
    )
    if (!availableGateways.includes(gateway)) {
      return { success: false, error: "PAYMENT_METHOD_NOT_AVAILABLE" }
    }

    // Calculate the fee amount
    const feeAmount = await calculateRegistrationFee(
      schoolId,
      application.campaign.academicYear,
      application.applyingForClass,
      application.campaign.applicationFee
        ? Number(application.campaign.applicationFee)
        : null
    )

    if (feeAmount <= 0) {
      return { success: false, error: "NO_FEE_CONFIGURED" }
    }

    const referenceNumber = `REG-${nanoid(10).toUpperCase()}`
    const baseUrl = getBaseUrl(school.domain ?? "")

    const checkoutResult = await createPaymentCheckout(gateway, {
      amount: feeAmount,
      currency,
      context: "admission_fee",
      schoolId,
      referenceId: application.id,
      referenceNumber,
      customerEmail: application.email ?? undefined,
      lineItems: [
        {
          name: `Registration Fee - ${application.applicationNumber}`,
          description: `Registration fee for ${application.firstName} ${application.lastName}`,
          quantity: 1,
          unitAmount: toSmallestUnit(feeAmount, currency),
        },
      ],
      metadata: {
        type: "registration_fee",
        applicationId: application.id,
      },
      successUrl: `${baseUrl}/${locale}/application/${applicationId}/offer?token=${encodeURIComponent(accessToken)}&registration=success`,
      cancelUrl: `${baseUrl}/${locale}/application/${applicationId}/offer?token=${encodeURIComponent(accessToken)}&registration=cancelled`,
    })

    if (!checkoutResult.success) {
      return {
        success: false,
        error: checkoutResult.error ?? "CHECKOUT_FAILED",
      }
    }

    // Record the payment method and amount
    await db.application.update({
      where: { id: applicationId, schoolId },
      data: {
        registrationFeeMethod: gateway,
        registrationFeeReference: referenceNumber,
        registrationFeeAmount: feeAmount,
      },
    })

    revalidatePath("/application")

    return {
      success: true,
      data: {
        method: gateway,
        checkoutUrl: checkoutResult.checkoutUrl,
        referenceNumber,
      },
    }
  } catch (error) {
    console.error("[createRegistrationFeeCheckout]", error)
    return { success: false, error: "CHECKOUT_FAILED" }
  }
}

// ============================================================================
// 5. Record Registration Cash Intent
// ============================================================================

/**
 * Record the parent's intent to pay the registration fee in cash.
 * Returns a reference number and cash payment instructions.
 */
export async function recordRegistrationCashIntent(
  applicationId: string,
  accessToken: string
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    // Rate limit: 5 attempts per minute per token (mirrors the checkout
    // limiter — each attempt writes a fresh reference number).
    const rl = await checkUserRateLimit(
      `reg-cash:${accessToken}`,
      RATE_LIMITS.AUTH,
      "reg-cash"
    )
    if (!rl.allowed) {
      return { success: false, error: "RATE_LIMITED" }
    }

    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Offer must still be live — a withdrawn or expired offer is not payable.
    if (application.status !== "SELECTED") {
      return { success: false, error: "OFFER_NOT_AVAILABLE" }
    }
    if (isOfferExpired(application.offerExpiryDate)) {
      return { success: false, error: "OFFER_EXPIRED" }
    }

    // Must have accepted the offer first
    if (!application.offerAccepted) {
      return { success: false, error: "OFFER_NOT_ACCEPTED" }
    }

    // Already paid — hard block. A method recorded but unpaid (the applicant
    // picked a different method earlier, or an admin asked them to switch so
    // the cash-confirm flow can proceed) is NOT a lock: re-recording below
    // overwrites the stale method/reference/amount instead.
    if (application.registrationFeePaid) {
      return { success: false, error: "REGISTRATION_FEE_ALREADY_PAID" }
    }

    const schoolId = application.schoolId
    const referenceNumber = `RCASH-${nanoid(10).toUpperCase()}`

    // Get school currency, cash instructions, and notification language —
    // independent reads, run together.
    const [school, settings, lang] = await Promise.all([
      db.school.findUnique({
        where: { id: schoolId },
        select: { currency: true },
      }),
      db.admissionSettings.findUnique({
        where: { schoolId },
        select: { cashPaymentInstructions: true },
      }),
      resolveSchoolLang(schoolId),
    ])

    // Calculate fee amount
    const feeAmount = await calculateRegistrationFee(
      schoolId,
      application.campaign.academicYear,
      application.applyingForClass,
      application.campaign.applicationFee
        ? Number(application.campaign.applicationFee)
        : null
    )

    const cashResult = await createPaymentCheckout("cash", {
      amount: feeAmount,
      currency: school?.currency ?? "USD",
      context: "admission_fee",
      schoolId,
      referenceId: application.id,
      referenceNumber,
      successUrl: "",
      cancelUrl: "",
      metadata: {
        cashInstructions: settings?.cashPaymentInstructions ?? "",
      },
    })

    // Record the payment method and amount
    await db.application.update({
      where: { id: applicationId, schoolId },
      data: {
        registrationFeeMethod: "cash",
        registrationFeeReference: referenceNumber,
        registrationFeeAmount: feeAmount > 0 ? feeAmount : undefined,
      },
    })

    // Notify school admins about cash intent — in the school's own language
    const applicantName = `${application.firstName} ${application.lastName}`
    await dispatchNotificationsToAudience({
      schoolId,
      type: "system_alert",
      title: t(NOTIF.registrationFeePaid.title, lang),
      body: t(NOTIF.registrationFeePaid.body(applicantName, "cash"), lang),
      lang,
      targetScope: "role",
      targetRole: "ADMIN",
      metadata: {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        action: "registration_cash_intent",
        referenceNumber,
      },
    })

    revalidatePath("/application")

    return {
      success: true,
      data: {
        method: "cash",
        cashInstructions: cashResult.cashInstructions,
        referenceNumber,
      },
    }
  } catch (error) {
    console.error("[recordRegistrationCashIntent]", error)
    return { success: false, error: "PAYMENT_RECORD_FAILED" }
  }
}

// ============================================================================
// 6. Record Registration Bank Transfer Intent
// ============================================================================

/**
 * Record the parent's intent to pay the registration fee via bank transfer.
 * Returns a reference number and bank transfer details.
 */
export async function recordRegistrationBankTransferIntent(
  applicationId: string,
  accessToken: string
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    // Rate limit: 5 attempts per minute per token (mirrors the checkout
    // limiter — each attempt writes a fresh reference number).
    const rl = await checkUserRateLimit(
      `reg-bank:${accessToken}`,
      RATE_LIMITS.AUTH,
      "reg-bank"
    )
    if (!rl.allowed) {
      return { success: false, error: "RATE_LIMITED" }
    }

    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Offer must still be live — a withdrawn or expired offer is not payable.
    if (application.status !== "SELECTED") {
      return { success: false, error: "OFFER_NOT_AVAILABLE" }
    }
    if (isOfferExpired(application.offerExpiryDate)) {
      return { success: false, error: "OFFER_EXPIRED" }
    }

    // Must have accepted the offer first
    if (!application.offerAccepted) {
      return { success: false, error: "OFFER_NOT_ACCEPTED" }
    }

    // Already paid — hard block. A method recorded but unpaid (the applicant
    // picked a different method earlier, or an admin asked them to switch so
    // the cash-confirm flow can proceed) is NOT a lock: re-recording below
    // overwrites the stale method/reference/amount instead.
    if (application.registrationFeePaid) {
      return { success: false, error: "REGISTRATION_FEE_ALREADY_PAID" }
    }

    const schoolId = application.schoolId
    const referenceNumber = `RTRF-${nanoid(10).toUpperCase()}`

    // Get school currency, bank details, and notification language —
    // independent reads, run together.
    const [school, settings, lang] = await Promise.all([
      db.school.findUnique({
        where: { id: schoolId },
        select: { currency: true },
      }),
      db.admissionSettings.findUnique({
        where: { schoolId },
        select: { bankDetails: true },
      }),
      resolveSchoolLang(schoolId),
    ])

    const bankDetails = settings?.bankDetails as Record<string, string> | null

    // Calculate fee amount
    const feeAmount = await calculateRegistrationFee(
      schoolId,
      application.campaign.academicYear,
      application.applyingForClass,
      application.campaign.applicationFee
        ? Number(application.campaign.applicationFee)
        : null
    )

    const transferResult = await createPaymentCheckout("bank_transfer", {
      amount: feeAmount,
      currency: school?.currency ?? "USD",
      context: "admission_fee",
      schoolId,
      referenceId: application.id,
      referenceNumber,
      successUrl: "",
      cancelUrl: "",
      metadata: bankDetails
        ? {
            bankName: bankDetails.bankName ?? "",
            accountName: bankDetails.accountName ?? "",
            accountNumber: bankDetails.accountNumber ?? "",
            iban: bankDetails.iban ?? "",
            swiftCode: bankDetails.swiftCode ?? "",
          }
        : {},
    })

    // Record the payment method and amount
    await db.application.update({
      where: { id: applicationId, schoolId },
      data: {
        registrationFeeMethod: "bank_transfer",
        registrationFeeReference: referenceNumber,
        registrationFeeAmount: feeAmount > 0 ? feeAmount : undefined,
      },
    })

    // Notify school admins about bank transfer intent — in the school's own
    // language
    const applicantName = `${application.firstName} ${application.lastName}`
    await dispatchNotificationsToAudience({
      schoolId,
      type: "system_alert",
      title: t(NOTIF.registrationFeePaid.title, lang),
      body: t(
        NOTIF.registrationFeePaid.body(applicantName, "bank_transfer"),
        lang
      ),
      lang,
      targetScope: "role",
      targetRole: "ADMIN",
      metadata: {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        action: "registration_bank_transfer_intent",
        referenceNumber,
      },
    })

    revalidatePath("/application")

    return {
      success: true,
      data: {
        method: "bank_transfer",
        bankDetails: transferResult.bankDetails,
        referenceNumber,
      },
    }
  } catch (error) {
    console.error("[recordRegistrationBankTransferIntent]", error)
    return { success: false, error: "PAYMENT_RECORD_FAILED" }
  }
}
