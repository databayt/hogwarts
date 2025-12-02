"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { stripe } from "@/components/marketing/pricing/lib/stripe";
import { absoluteUrl } from "@/components/marketing/pricing/lib/utils";

export type responseAction = {
  status: "success" | "error";
  stripeUrl?: string;
};

const billingUrl = absoluteUrl("/starter/admin/billing");

export async function openCustomerPortal(
  userStripeId: string,
): Promise<responseAction> {
  let redirectUrl: string = "";

  try {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    const session = await auth();

    if (!session?.user || !session?.user.email) {
      throw new Error("Unauthorized");
    }

    if (userStripeId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userStripeId,
        return_url: billingUrl,
      });

      redirectUrl = stripeSession.url as string;
    }
  } catch (error) {
    throw new Error("Failed to generate user stripe session");
  }

  redirect(redirectUrl);
}
