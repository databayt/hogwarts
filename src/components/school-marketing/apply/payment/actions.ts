"use server"

import { nanoid } from "nanoid"

import { db } from "@/lib/db"
import type { PaymentCheckoutResult } from "@/lib/payment/types"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { stripe } from "@/components/saas-marketing/pricing/lib/stripe"

import type { ActionResult } from "../../admission/types"

/**
 * Create a Stripe Checkout session for an application fee
 */
export async function createStripeCheckout(
  subdomain: string,
  applicationId: string,
  amount: number,
  currency: string
): Promise<ActionResult<PaymentCheckoutResult>> {
  try {
    if (!stripe) {
      return { success: false, error: "Stripe is not configured" }
    }

    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId: schoolResult.data.id },
      select: {
        id: true,
        applicationNumber: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!application) {
      return { success: false, error: "Application not found" }
    }

    const referenceNumber = `PAY-${nanoid(10).toUpperCase()}`

    // Convert amount to Stripe's smallest currency unit (cents/fils)
    const unitAmount = Math.round(amount * 100)

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
        schoolId: schoolResult.data.id,
        referenceNumber,
      },
      success_url: `https://${subdomain}.databayt.org/apply/${applicationId}/success?number=${application.applicationNumber}`,
      cancel_url: `https://${subdomain}.databayt.org/apply/${applicationId}/payment?number=${application.applicationNumber}&cancelled=true`,
    })

    // Record the payment method on the application
    await db.application.update({
      where: { id: applicationId },
      data: {
        paymentMethod: "stripe",
        paymentReference: referenceNumber,
      },
    })

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
): Promise<ActionResult<PaymentCheckoutResult>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId: schoolResult.data.id },
      select: { id: true, applicationNumber: true },
    })

    if (!application) {
      return { success: false, error: "Application not found" }
    }

    const referenceNumber = `CASH-${nanoid(10).toUpperCase()}`

    // Get school's custom cash instructions
    const settings = await db.admissionSettings.findUnique({
      where: { schoolId: schoolResult.data.id },
      select: { cashPaymentInstructions: true },
    })

    await db.application.update({
      where: { id: applicationId },
      data: {
        paymentMethod: "cash",
        paymentReference: referenceNumber,
      },
    })

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
): Promise<ActionResult<PaymentCheckoutResult>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId: schoolResult.data.id },
      select: { id: true, applicationNumber: true },
    })

    if (!application) {
      return { success: false, error: "Application not found" }
    }

    const referenceNumber = `TRF-${nanoid(10).toUpperCase()}`

    // Get school's bank details
    const settings = await db.admissionSettings.findUnique({
      where: { schoolId: schoolResult.data.id },
      select: { bankDetails: true },
    })

    await db.application.update({
      where: { id: applicationId },
      data: {
        paymentMethod: "bank_transfer",
        paymentReference: referenceNumber,
      },
    })

    const bankDetails = settings?.bankDetails as Record<string, string> | null

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
