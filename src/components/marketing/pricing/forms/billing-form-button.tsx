"use client";

import { useTransition } from "react";
import { generateUserStripe } from "@/components/marketing/pricing/actions/generate-user-stripe";
import { SubscriptionPlan, UserSubscriptionPlan } from "@/components/marketing/pricing/types";

import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";
import { Icons } from "@/components/marketing/pricing/shared/icons";

interface BillingFormButtonProps {
  offer: SubscriptionPlan;
  subscriptionPlan: UserSubscriptionPlan;
  year: boolean;
  userRole?: UserRole;
}

export function BillingFormButton({
  year,
  offer,
  subscriptionPlan,
  userRole,
}: BillingFormButtonProps) {
  const [isPending, startTransition] = useTransition();
  const selectedPriceId = offer.stripeIds[year ? "yearly" : "monthly"];
  const generateUserStripeSession = generateUserStripe.bind(null, selectedPriceId as string);

  const stripeSessionAction = () =>
    startTransition(() => {
      void generateUserStripeSession();
    });

  const userOffer =
    subscriptionPlan.stripePriceId ===
    offer.stripeIds[year ? "yearly" : "monthly"];

  const isAvailable = Boolean(selectedPriceId);

  return (
    <Button
      variant={"default"}
      className=""
      disabled={isPending || !isAvailable}
      onClick={stripeSessionAction}
    >
      {isPending ? (
        <>
          <Icons.spinner className="me-2 size-4 animate-spin" /> Loading...
        </>
      ) : (
        <>
          {!isAvailable
            ? "Unavailable"
            : userOffer
            ? "Manage Subscription"
            : offer.title.toLowerCase() === "pro"
            ? "Get Pro"
            : offer.title.toLowerCase() === "ultra"
            ? "Get Ultra"
            : "Get plan"}
        </>
      )}
    </Button>
  );
}
