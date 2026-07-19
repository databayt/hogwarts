"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { stripe } from "@/components/saas-marketing/pricing/lib/stripe"
import { absoluteUrl } from "@/components/saas-marketing/pricing/lib/utils"

export type responseAction = {
  status: "success" | "error"
  stripeUrl?: string
}

const billingUrl = absoluteUrl("/starter/admin/billing")

const BILLING_ROLES: ReadonlySet<string> = new Set([
  "ADMIN",
  "ACCOUNTANT",
  "DEVELOPER",
])

export async function openCustomerPortal(
  userStripeId: string
): Promise<responseAction> {
  let redirectUrl: string = ""

  try {
    if (!stripe) {
      throw new Error("Stripe is not configured")
    }

    const session = await auth()

    if (!session?.user || !session?.user.email) {
      throw new Error("Unauthorized")
    }

    if (!BILLING_ROLES.has(session.user.role ?? "")) {
      throw new Error("Unauthorized")
    }

    // The portal grants payment-method + invoice control over the customer,
    // so the client-supplied id must belong to the caller's own school.
    if (userStripeId) {
      const schoolId = session.user.schoolId
      if (!schoolId) throw new Error("Unauthorized")

      const subscription = await db.subscription.findFirst({
        where: { schoolId, stripeCustomerId: userStripeId },
        select: { id: true },
      })
      if (!subscription) throw new Error("Unauthorized")

      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userStripeId,
        return_url: billingUrl,
      })

      redirectUrl = stripeSession.url as string
    }
  } catch (error) {
    throw new Error("Failed to generate user stripe session")
  }

  redirect(redirectUrl)
}
