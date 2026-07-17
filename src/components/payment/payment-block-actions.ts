"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import { nanoid } from "nanoid"
import { z } from "zod"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { toSmallestUnit } from "@/lib/payment/currency"
import { createPaymentCheckout } from "@/lib/payment/provider"
import { PAYMENT_GATEWAYS } from "@/lib/payment/types"
import type {
  CheckoutResult,
  PaymentContext,
  PaymentGateway,
} from "@/lib/payment/types"
import { getTenantContext } from "@/lib/tenant-context"
import { buildTenantBaseUrl } from "@/components/school-dashboard/finance/fees/tenant-url"

// The client may send display hints, but the SERVER is authoritative for money
// and redirect URLs. `amount`, `currency`, `successUrl`, and `cancelUrl` are
// intentionally NOT trusted from the client — they are resolved from the
// referenced entity (scoped by schoolId) below. This closes the previous
// amount-tampering + open-redirect holes on this exported server action.
const initiatePaymentSchema = z.object({
  gateway: z.enum(PAYMENT_GATEWAYS),
  context: z.enum([
    "admission_fee",
    "saas_subscription",
    "tuition_fee",
    "school_fee",
    "salary_payout",
    "course_enrollment",
  ] as const),
  referenceId: z.string().min(1),
  locale: z.enum(["en", "ar"]).default("en"),
  customerEmail: z.string().email().optional(),
})

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>

interface ResolvedPayable {
  amount: number
  currency: string
  successUrl: string
  cancelUrl: string
  label: string
  metadata: Record<string, string>
}

/**
 * Universal server action for initiating a payment through any gateway.
 *
 * Security model: requires an authenticated session, resolves schoolId from the
 * tenant context, and derives the amount/currency/URLs server-side from the
 * referenced entity. The client cannot influence how much is charged or where
 * the user is redirected. Only fee contexts are payable through this generic
 * primitive; admission/course/subscription have dedicated, ownership-checked
 * flows and are rejected here.
 */
export async function initiatePayment(
  input: InitiatePaymentInput
): Promise<ActionResponse<CheckoutResult>> {
  try {
    const parsed = initiatePaymentSchema.parse(input)

    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const resolved = await resolvePayable(
      parsed.context,
      parsed.referenceId,
      parsed.locale,
      schoolId
    )
    if (!resolved) {
      return {
        success: false,
        error:
          "This payment reference is not payable here. Use the dedicated flow for admission, course, or subscription payments.",
      }
    }

    const referenceNumber = generateReferenceNumber(parsed.gateway)
    const metadata: Record<string, string> = { ...resolved.metadata }

    // Offline methods: hydrate school-specific instructions/bank details.
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
      amount: resolved.amount,
      currency: resolved.currency,
      context: parsed.context as PaymentContext,
      schoolId,
      referenceId: parsed.referenceId,
      referenceNumber,
      successUrl: resolved.successUrl,
      cancelUrl: resolved.cancelUrl,
      customerEmail: parsed.customerEmail,
      lineItems: [
        {
          name: resolved.label,
          quantity: 1,
          unitAmount: toSmallestUnit(resolved.amount, resolved.currency),
        },
      ],
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

/**
 * Resolve the server-authoritative amount/currency/URLs for a payable entity.
 * Returns null when the context/reference is not payable via this primitive.
 */
async function resolvePayable(
  context: PaymentContext,
  referenceId: string,
  locale: string,
  schoolId: string
): Promise<ResolvedPayable | null> {
  if (context === "school_fee" || context === "tuition_fee") {
    const assignment = await db.feeAssignment.findFirst({
      where: { id: referenceId, schoolId },
      include: {
        payments: { where: { status: "SUCCESS" }, select: { amount: true } },
        feeStructure: { select: { name: true } },
        student: { select: { firstName: true, lastName: true } },
      },
    })
    if (!assignment) return null

    const paid = assignment.payments.reduce((s, p) => s + Number(p.amount), 0)
    const remaining = Number(assignment.finalAmount) - paid
    if (remaining <= 0) return null

    const school = await db.school.findFirst({
      where: { id: schoolId },
      select: { currency: true, domain: true },
    })
    const baseUrl = buildTenantBaseUrl(school?.domain)

    return {
      amount: remaining,
      currency: school?.currency || "USD",
      successUrl: `${baseUrl}/${locale}/finance/fees/assignments/${referenceId}?payment=success`,
      cancelUrl: `${baseUrl}/${locale}/finance/fees/assignments/${referenceId}?payment=cancelled`,
      label: assignment.feeStructure?.name || "School Fee",
      metadata: {
        type: "fee_payment",
        feeAssignmentId: referenceId,
        studentId: assignment.studentId,
        schoolId,
      },
    }
  }

  // admission_fee / course_enrollment / saas_subscription / salary_payout are
  // handled by their own dedicated, ownership-checked flows.
  return null
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
