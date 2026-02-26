"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { nanoid } from "nanoid"
import { z } from "zod"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { createPaymentCheckout } from "@/lib/payment/provider"
import type {
  CheckoutResult,
  PaymentContext,
  PaymentGateway,
} from "@/lib/payment/types"
import { getTenantContext } from "@/lib/tenant-context"

const initiatePaymentSchema = z.object({
  gateway: z.enum([
    "stripe",
    "tap",
    "cash",
    "bank_transfer",
    "mobile_money",
  ] as const),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  context: z.enum([
    "admission_fee",
    "saas_subscription",
    "tuition_fee",
    "school_fee",
    "salary_payout",
    "course_enrollment",
  ] as const),
  referenceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerEmail: z.string().email().optional(),
  lineItems: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        quantity: z.number().int().positive(),
        unitAmount: z.number().int().positive(),
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>

/**
 * Universal server action for initiating a payment through any gateway.
 * Validates input, resolves school context, and dispatches to the correct provider.
 */
export async function initiatePayment(
  input: InitiatePaymentInput
): Promise<ActionResponse<CheckoutResult>> {
  try {
    const parsed = initiatePaymentSchema.parse(input)

    // Resolve school context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const referenceNumber = generateReferenceNumber(parsed.gateway)

    // For offline methods, resolve school-specific settings
    const metadata: Record<string, string> = { ...(parsed.metadata ?? {}) }

    if (parsed.gateway === "cash") {
      const settings = await db.admissionSettings.findUnique({
        where: { schoolId },
        select: { cashPaymentInstructions: true },
      })
      if (settings?.cashPaymentInstructions) {
        metadata.cashInstructions = settings.cashPaymentInstructions
      }
    }

    if (parsed.gateway === "bank_transfer") {
      const settings = await db.admissionSettings.findUnique({
        where: { schoolId },
        select: { bankDetails: true },
      })
      const bankDetails = settings?.bankDetails as Record<string, string> | null
      if (bankDetails) {
        metadata.bankName = bankDetails.bankName ?? ""
        metadata.accountName = bankDetails.accountName ?? ""
        metadata.accountNumber = bankDetails.accountNumber ?? ""
        if (bankDetails.iban) metadata.iban = bankDetails.iban
        if (bankDetails.swiftCode) metadata.swiftCode = bankDetails.swiftCode
      }
    }

    const result = await createPaymentCheckout(parsed.gateway, {
      amount: parsed.amount,
      currency: parsed.currency,
      context: parsed.context as PaymentContext,
      schoolId,
      referenceId: parsed.referenceId,
      referenceNumber,
      successUrl: parsed.successUrl,
      cancelUrl: parsed.cancelUrl,
      customerEmail: parsed.customerEmail,
      lineItems: parsed.lineItems,
      metadata,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid payment parameters" }
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to initiate payment",
    }
  }
}

function generateReferenceNumber(gateway: PaymentGateway): string {
  const prefix =
    gateway === "stripe"
      ? "PAY"
      : gateway === "tap"
        ? "TAP"
        : gateway === "cash"
          ? "CASH"
          : gateway === "bank_transfer"
            ? "TRF"
            : "MOB"
  return `${prefix}-${nanoid(10).toUpperCase()}`
}
