"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { toSmallestUnit } from "@/lib/payment/currency"
import { createPaymentCheckout } from "@/lib/payment/provider"
import type { PaymentCheckoutResult } from "@/lib/payment/types"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

function getBaseUrl(subdomain: string): string {
  const isProd = process.env.NODE_ENV === "production"
  return isProd
    ? `https://${subdomain}.databayt.org`
    : `http://${subdomain}.localhost:3000`
}

/**
 * Create a Stripe Checkout session for an application fee.
 * Fee amount and currency are always sourced from the database
 * (campaign.applicationFee / school.currency) — never from client params.
 */
export async function createStripeCheckout(
  subdomain: string,
  applicationId: string,
  locale: string,
  accessToken: string
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    if (!accessToken) {
      return { success: false, error: "APPLICATION_NOT_FOUND" }
    }

    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "SCHOOL_NOT_FOUND" }
    }

    const schoolId = schoolResult.data.id

    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId, accessToken },
      select: {
        id: true,
        applicationNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        paymentMethod: true,
        campaign: {
          select: { applicationFee: true },
        },
      },
    })

    if (!application) {
      return { success: false, error: "APPLICATION_NOT_FOUND" }
    }

    if (application.paymentMethod) {
      return { success: false, error: "PAYMENT_ALREADY_RECORDED" }
    }

    const fee = application.campaign.applicationFee
    if (!fee || Number(fee) <= 0) {
      return { success: false, error: "NO_FEE_CONFIGURED" }
    }

    const currency = schoolResult.data.currency ?? "USD"
    const amount = Number(fee)
    const referenceNumber = `PAY-${nanoid(10).toUpperCase()}`
    const baseUrl = getBaseUrl(subdomain)

    const result = await createPaymentCheckout("stripe", {
      amount,
      currency,
      context: "admission_fee",
      schoolId,
      referenceId: application.id,
      referenceNumber,
      customerEmail: application.email ?? undefined,
      lineItems: [
        {
          name: `Application Fee - ${application.applicationNumber}`,
          description: `Application fee for ${application.firstName} ${application.lastName}`,
          quantity: 1,
          unitAmount: toSmallestUnit(amount, currency),
        },
      ],
      metadata: {
        type: "application_fee",
        applicationId: application.id,
      },
      successUrl: `${baseUrl}/${locale}/application/${applicationId}/success?number=${application.applicationNumber}`,
      cancelUrl: `${baseUrl}/${locale}/application/${applicationId}/payment?number=${application.applicationNumber}&token=${encodeURIComponent(accessToken)}&cancelled=true`,
    })

    if (!result.success) {
      return { success: false, error: result.error ?? "CHECKOUT_FAILED" }
    }

    await db.application.update({
      where: { id: applicationId, schoolId },
      data: {
        paymentMethod: "stripe",
        paymentReference: referenceNumber,
      },
    })

    revalidatePath("/application")

    return {
      success: true,
      data: {
        method: "stripe",
        checkoutUrl: result.checkoutUrl,
        referenceNumber,
      },
    }
  } catch (error) {
    console.error("[createStripeCheckout]", error)
    return { success: false, error: "CHECKOUT_FAILED" }
  }
}

/**
 * Record intent to pay in cash at school
 */
export async function recordCashPaymentIntent(
  subdomain: string,
  applicationId: string,
  accessToken: string
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    if (!accessToken) {
      return { success: false, error: "APPLICATION_NOT_FOUND" }
    }

    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "SCHOOL_NOT_FOUND" }
    }

    const schoolId = schoolResult.data.id

    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId, accessToken },
      select: { id: true, applicationNumber: true, paymentMethod: true },
    })

    if (!application) {
      return { success: false, error: "APPLICATION_NOT_FOUND" }
    }

    if (application.paymentMethod) {
      return { success: false, error: "PAYMENT_ALREADY_RECORDED" }
    }

    const referenceNumber = `CASH-${nanoid(10).toUpperCase()}`

    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: { cashPaymentInstructions: true },
    })

    const result = await createPaymentCheckout("cash", {
      amount: 0,
      currency: schoolResult.data.currency ?? "USD",
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

    await db.application.update({
      where: { id: applicationId, schoolId },
      data: {
        paymentMethod: "cash",
        paymentReference: referenceNumber,
      },
    })

    revalidatePath("/application")

    return {
      success: true,
      data: {
        method: "cash",
        cashInstructions: result.cashInstructions,
        referenceNumber,
      },
    }
  } catch (error) {
    console.error("[recordCashPaymentIntent]", error)
    return { success: false, error: "PAYMENT_RECORD_FAILED" }
  }
}

/**
 * Record intent to pay via bank transfer
 */
export async function recordBankTransferIntent(
  subdomain: string,
  applicationId: string,
  accessToken: string
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    if (!accessToken) {
      return { success: false, error: "APPLICATION_NOT_FOUND" }
    }

    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "SCHOOL_NOT_FOUND" }
    }

    const schoolId = schoolResult.data.id

    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId, accessToken },
      select: { id: true, applicationNumber: true, paymentMethod: true },
    })

    if (!application) {
      return { success: false, error: "APPLICATION_NOT_FOUND" }
    }

    if (application.paymentMethod) {
      return { success: false, error: "PAYMENT_ALREADY_RECORDED" }
    }

    const referenceNumber = `TRF-${nanoid(10).toUpperCase()}`

    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: { bankDetails: true },
    })

    const bankDetails = settings?.bankDetails as Record<string, string> | null

    const result = await createPaymentCheckout("bank_transfer", {
      amount: 0,
      currency: schoolResult.data.currency ?? "USD",
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

    await db.application.update({
      where: { id: applicationId, schoolId },
      data: {
        paymentMethod: "bank_transfer",
        paymentReference: referenceNumber,
      },
    })

    revalidatePath("/application")

    return {
      success: true,
      data: {
        method: "bank_transfer",
        bankDetails: result.bankDetails,
        referenceNumber,
      },
    }
  } catch (error) {
    console.error("[recordBankTransferIntent]", error)
    return { success: false, error: "PAYMENT_RECORD_FAILED" }
  }
}
