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
} from "@/lib/dispatch-notification"
import { extractGradeNumber } from "@/lib/grade-utils"
import { toSmallestUnit } from "@/lib/payment/currency"
import { createPaymentCheckout } from "@/lib/payment/provider"
import type { PaymentCheckoutResult } from "@/lib/payment/types"

// ============================================================================
// Types
// ============================================================================

export interface OfferDetails {
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
async function calculateRegistrationFee(
  schoolId: string,
  academicYear: string,
  applyingForClass: string,
  campaignApplicationFee: number | null
): Promise<number> {
  const gradeNumber = extractGradeNumber(applyingForClass)

  // Find matching FeeStructure records
  const feeStructures = await db.feeStructure.findMany({
    where: {
      schoolId,
      academicYear,
      isActive: true,
      ...(gradeNumber
        ? {
            OR: [
              { classId: null }, // School-wide fee structures
              {
                class: {
                  grade: gradeNumber,
                },
              },
            ],
          }
        : { classId: null }),
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

    // Must be in SELECTED status for offer to be active
    if (application.status !== "SELECTED") {
      return { success: false, error: "OFFER_NOT_AVAILABLE" }
    }

    // Check offer expiry
    if (isOfferExpired(application.offerExpiryDate)) {
      return { success: false, error: "OFFER_EXPIRED" }
    }

    const schoolId = application.schoolId

    // Fetch school info
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        address: true,
        currency: true,
      },
    })

    if (!school) {
      return { success: false, error: "SCHOOL_NOT_FOUND" }
    }

    // Fetch fee schedule preview
    const gradeNumber = extractGradeNumber(application.applyingForClass)
    const feeStructures = await db.feeStructure.findMany({
      where: {
        schoolId,
        academicYear: application.campaign.academicYear,
        isActive: true,
        ...(gradeNumber
          ? {
              OR: [{ classId: null }, { class: { grade: gradeNumber } }],
            }
          : { classId: null }),
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

    await db.application.update({
      where: { id: applicationId, schoolId: application.schoolId },
      data: {
        offerAccepted: true,
        offerAcceptedAt: now,
      },
    })

    // Notify school admins
    const applicantName = `${application.firstName} ${application.lastName}`
    await dispatchNotificationsToAudience({
      schoolId: application.schoolId,
      type: "admission",
      title: t(NOTIF.offerAccepted.title, "ar"),
      body: t(NOTIF.offerAccepted.body(applicantName), "ar"),
      lang: "ar",
      priority: "high",
      targetScope: "role",
      targetRole: "ADMIN",
      metadata: {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        action: "offer_accepted",
      },
    })

    // Also notify in English for bilingual schools
    await dispatchNotificationsToAudience({
      schoolId: application.schoolId,
      type: "admission",
      title: t(NOTIF.offerAccepted.title, "en"),
      body: t(NOTIF.offerAccepted.body(applicantName), "en"),
      lang: "en",
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
        type: "admission",
        title: t(NOTIF.offerAccepted.title, "ar"),
        body: t(NOTIF.offerAccepted.body(applicantName), "ar"),
        lang: "ar",
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
    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Must be SELECTED
    if (application.status !== "SELECTED") {
      return { success: false, error: "OFFER_NOT_AVAILABLE" }
    }

    await db.application.update({
      where: { id: applicationId, schoolId: application.schoolId },
      data: {
        status: "WITHDRAWN",
      },
    })

    // Notify school admins
    const applicantName = `${application.firstName} ${application.lastName}`
    await dispatchNotificationsToAudience({
      schoolId: application.schoolId,
      type: "admission",
      title: t(NOTIF.offerDeclined.title, "ar"),
      body: t(NOTIF.offerDeclined.body(applicantName), "ar"),
      lang: "ar",
      priority: "high",
      targetScope: "role",
      targetRole: "ADMIN",
      metadata: {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        action: "offer_declined",
      },
    })

    await dispatchNotificationsToAudience({
      schoolId: application.schoolId,
      type: "admission",
      title: t(NOTIF.offerDeclined.title, "en"),
      body: t(NOTIF.offerDeclined.body(applicantName), "en"),
      lang: "en",
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
        type: "admission",
        title: t(NOTIF.offerDeclined.title, "ar"),
        body: t(NOTIF.offerDeclined.body(applicantName), "ar"),
        lang: "ar",
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
  locale: string
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Must have accepted the offer first
    if (!application.offerAccepted) {
      return { success: false, error: "OFFER_NOT_ACCEPTED" }
    }

    // Already paid
    if (application.registrationFeePaid) {
      return { success: false, error: "REGISTRATION_FEE_ALREADY_PAID" }
    }

    // Already has a payment method recorded (pending)
    if (application.registrationFeeMethod) {
      return { success: false, error: "PAYMENT_ALREADY_RECORDED" }
    }

    const schoolId = application.schoolId

    // Get school details for currency
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        currency: true,
        subdomain: true,
      },
    })

    if (!school) {
      return { success: false, error: "SCHOOL_NOT_FOUND" }
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

    const currency = school.currency ?? "USD"
    const referenceNumber = `REG-${nanoid(10).toUpperCase()}`
    const baseUrl = getBaseUrl(school.subdomain ?? "")

    const checkoutResult = await createPaymentCheckout("stripe", {
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
        registrationFeeMethod: "stripe",
        registrationFeeReference: referenceNumber,
        registrationFeeAmount: feeAmount,
      },
    })

    revalidatePath("/application")

    return {
      success: true,
      data: {
        method: "stripe",
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
    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Must have accepted the offer first
    if (!application.offerAccepted) {
      return { success: false, error: "OFFER_NOT_ACCEPTED" }
    }

    // Already paid
    if (application.registrationFeePaid) {
      return { success: false, error: "REGISTRATION_FEE_ALREADY_PAID" }
    }

    // Already has a payment method recorded
    if (application.registrationFeeMethod) {
      return { success: false, error: "PAYMENT_ALREADY_RECORDED" }
    }

    const schoolId = application.schoolId
    const referenceNumber = `RCASH-${nanoid(10).toUpperCase()}`

    // Get school currency and cash instructions
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    })

    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: { cashPaymentInstructions: true },
    })

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

    // Notify school admins about cash intent
    const applicantName = `${application.firstName} ${application.lastName}`
    await dispatchNotificationsToAudience({
      schoolId,
      type: "admission",
      title: t(NOTIF.registrationFeePaid.title, "ar"),
      body: t(NOTIF.registrationFeePaid.body(applicantName, "cash"), "ar"),
      lang: "ar",
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
    const result = await validateAccessToken(applicationId, accessToken)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    const { application } = result

    // Must have accepted the offer first
    if (!application.offerAccepted) {
      return { success: false, error: "OFFER_NOT_ACCEPTED" }
    }

    // Already paid
    if (application.registrationFeePaid) {
      return { success: false, error: "REGISTRATION_FEE_ALREADY_PAID" }
    }

    // Already has a payment method recorded
    if (application.registrationFeeMethod) {
      return { success: false, error: "PAYMENT_ALREADY_RECORDED" }
    }

    const schoolId = application.schoolId
    const referenceNumber = `RTRF-${nanoid(10).toUpperCase()}`

    // Get school currency and bank details
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    })

    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: { bankDetails: true },
    })

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

    // Notify school admins about bank transfer intent
    const applicantName = `${application.firstName} ${application.lastName}`
    await dispatchNotificationsToAudience({
      schoolId,
      type: "admission",
      title: t(NOTIF.registrationFeePaid.title, "ar"),
      body: t(
        NOTIF.registrationFeePaid.body(applicantName, "bank_transfer"),
        "ar"
      ),
      lang: "ar",
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
