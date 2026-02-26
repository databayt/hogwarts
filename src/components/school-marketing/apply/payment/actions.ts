"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import type { PaymentCheckoutResult } from "@/lib/payment/types"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { stripe } from "@/components/saas-marketing/pricing/lib/stripe"

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
  locale: string
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    if (!stripe) {
      return { success: false, error: "Stripe is not configured" }
    }

    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id

    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: {
        id: true,
        applicationNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        campaign: {
          select: { applicationFee: true },
        },
      },
    })

    if (!application) {
      return { success: false, error: "Application not found" }
    }

    // Fee comes from DB — never from URL params
    const fee = application.campaign.applicationFee
    if (!fee || Number(fee) <= 0) {
      return { success: false, error: "No application fee configured" }
    }

    const currency = schoolResult.data.currency ?? "USD"
    const amount = Number(fee)
    const referenceNumber = `PAY-${nanoid(10).toUpperCase()}`

    // Convert amount to Stripe's smallest currency unit (cents/fils)
    const unitAmount = Math.round(amount * 100)

    const baseUrl = getBaseUrl(subdomain)

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: application.email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Application Fee - ${application.applicationNumber}`,
              description: `Application fee for ${application.firstName} ${application.lastName}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "application_fee",
        applicationId: application.id,
        schoolId,
        referenceNumber,
      },
      success_url: `${baseUrl}/${locale}/s/${subdomain}/apply/${applicationId}/success?number=${application.applicationNumber}`,
      cancel_url: `${baseUrl}/${locale}/s/${subdomain}/apply/${applicationId}/payment?number=${application.applicationNumber}&cancelled=true`,
    })

    // Record the payment method on the application
    await db.application.update({
      where: { id: applicationId, schoolId },
      data: {
        paymentMethod: "stripe",
        paymentReference: referenceNumber,
      },
    })

    revalidatePath("/apply")

    return {
      success: true,
      data: {
        method: "stripe",
        checkoutUrl: session.url ?? undefined,
        referenceNumber,
      },
    }
  } catch (error) {
    console.error("[createStripeCheckout]", error)
    return { success: false, error: "Failed to create checkout session" }
  }
}

/**
 * Record intent to pay in cash at school
 */
export async function recordCashPaymentIntent(
  subdomain: string,
  applicationId: string
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id

    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: { id: true, applicationNumber: true },
    })

    if (!application) {
      return { success: false, error: "Application not found" }
    }

    const referenceNumber = `CASH-${nanoid(10).toUpperCase()}`

    // Get school's custom cash instructions
    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: { cashPaymentInstructions: true },
    })

    await db.application.update({
      where: { id: applicationId, schoolId },
      data: {
        paymentMethod: "cash",
        paymentReference: referenceNumber,
      },
    })

    revalidatePath("/apply")

    return {
      success: true,
      data: {
        method: "cash",
        cashInstructions: settings?.cashPaymentInstructions ?? undefined,
        referenceNumber,
      },
    }
  } catch (error) {
    console.error("[recordCashPaymentIntent]", error)
    return { success: false, error: "Failed to record payment intent" }
  }
}

/**
 * Record intent to pay via bank transfer
 */
export async function recordBankTransferIntent(
  subdomain: string,
  applicationId: string
): Promise<ActionResponse<PaymentCheckoutResult>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id

    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: { id: true, applicationNumber: true },
    })

    if (!application) {
      return { success: false, error: "Application not found" }
    }

    const referenceNumber = `TRF-${nanoid(10).toUpperCase()}`

    // Get school's bank details
    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: { bankDetails: true },
    })

    await db.application.update({
      where: { id: applicationId, schoolId },
      data: {
        paymentMethod: "bank_transfer",
        paymentReference: referenceNumber,
      },
    })

    const bankDetails = settings?.bankDetails as Record<string, string> | null

    revalidatePath("/apply")

    return {
      success: true,
      data: {
        method: "bank_transfer",
        bankDetails: bankDetails
          ? {
              bankName: bankDetails.bankName ?? "",
              accountName: bankDetails.accountName ?? "",
              accountNumber: bankDetails.accountNumber ?? "",
              iban: bankDetails.iban,
              swiftCode: bankDetails.swiftCode,
              reference: referenceNumber,
            }
          : undefined,
        referenceNumber,
      },
    }
  } catch (error) {
    console.error("[recordBankTransferIntent]", error)
    return { success: false, error: "Failed to record payment intent" }
  }
}
