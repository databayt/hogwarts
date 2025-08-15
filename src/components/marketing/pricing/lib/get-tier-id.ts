import { db } from "@/lib/db";

export async function getTierIdFromStripePrice(stripePriceId: string): Promise<string> {
  // Find the subscription tier that matches the Stripe price ID
  const tier = await db.subscriptionTier.findFirst({
    where: {
      OR: [
        { monthlyPriceStripeId: stripePriceId },
        { yearlyPriceStripeId: stripePriceId }
      ]
    },
    select: { id: true }
  });

  if (!tier) {
    throw new Error(`No subscription tier found for Stripe price ID: ${stripePriceId}`);
  }

  return tier.id;
}
