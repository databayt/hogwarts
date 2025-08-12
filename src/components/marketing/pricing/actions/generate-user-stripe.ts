"use server";

import { auth } from "@/auth";
import { stripe } from "@/components/marketing/pricing/lib/stripe";
import { getUserSubscriptionPlan } from "@/components/marketing/pricing/lib/subscription";
import { absoluteUrl } from "@/components/marketing/pricing/lib/utils";
import { redirect } from "next/navigation";

export type responseAction = {
  status: "success" | "error";
  stripeUrl?: string;
}

const billingUrl = absoluteUrl("/starter/dashboard/billing")
const pricingUrl = absoluteUrl("/pricing")

export async function generateUserStripe(priceId: string): Promise<responseAction> {
  let redirectUrl: string = "";

  try {
    const session = await auth()
    const user = session?.user;

    if (!user || !user.email || !user.id) {
      throw new Error("Unauthorized");
    }

    if (!priceId || typeof priceId !== "string") {
      throw new Error("Missing Stripe price id");
    }

    const subscriptionPlan = await getUserSubscriptionPlan(user.id)

    if (subscriptionPlan.isPaid && subscriptionPlan.stripeCustomerId) {
      // User on Paid Plan - Create a portal session to manage subscription.
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: subscriptionPlan.stripeCustomerId,
        return_url: billingUrl,
      })

      redirectUrl = stripeSession.url as string
    } else {
      // User on Free Plan - Create a checkout session to upgrade.
      const stripeSession = await stripe.checkout.sessions.create({
        success_url: pricingUrl,
        cancel_url: pricingUrl,
        payment_method_types: ["card"],
        mode: "subscription",
        billing_address_collection: "auto",
        customer_email: user.email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user.id,
        },
      })

      redirectUrl = stripeSession.url as string
    }
  } catch (error) {
    console.error("Stripe session creation failed:", error);
    throw new Error("Failed to generate user stripe session");
  }

  // no revalidatePath because redirect
  redirect(redirectUrl)
}