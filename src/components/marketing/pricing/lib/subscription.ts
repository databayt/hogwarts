import { pricingData } from "@/components/marketing/pricing/config";
import { db } from "@/lib/db";
import { stripe } from "@/components/marketing/pricing/lib/stripe";
import type { UserSubscriptionPlan } from "@/components/marketing/pricing/types";

export async function getUserSubscriptionPlan(
  userId: string
): Promise<UserSubscriptionPlan> {
  if (!userId) {
    throw new Error("Missing userId parameter");
  }

  const user = await db.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripePriceId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user is on a paid plan with proper null handling
  const currentPeriodEnd = user.stripeCurrentPeriodEnd?.getTime();
  const isPaid = Boolean(
    user.stripePriceId &&
    currentPeriodEnd &&
    currentPeriodEnd + 86_400_000 > Date.now()
  );

  // Find the pricing data corresponding to the user's plan
  const userPlan =
    pricingData.find((plan) => plan.stripeIds.monthly === user.stripePriceId) ||
    pricingData.find((plan) => plan.stripeIds.yearly === user.stripePriceId);

  const plan = isPaid && userPlan ? userPlan : pricingData[0];

  const interval = isPaid
    ? userPlan?.stripeIds.monthly === user.stripePriceId
      ? "month"
      : userPlan?.stripeIds.yearly === user.stripePriceId
        ? "year"
        : null
    : null;

  // Safely retrieve Stripe subscription with error handling
  let isCanceled = false;
  if (isPaid && user.stripeSubscriptionId && stripe) {
    try {
      const stripePlan = await stripe.subscriptions.retrieve(
        user.stripeSubscriptionId
      );
      isCanceled = stripePlan.cancel_at_period_end;
    } catch (error) {
      // Log error but don't crash - subscription might have been deleted
      console.error("Failed to retrieve Stripe subscription:", error);
      // Return a sensible default
      isCanceled = false;
    }
  }

  return {
    ...plan,
    ...user,
    stripeCurrentPeriodEnd: currentPeriodEnd ?? 0,
    isPaid,
    interval,
    isCanceled,
  };
}
