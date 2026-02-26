"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { UserRole } from "@prisma/client"

import { Button } from "@/components/ui/button"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { generateUserStripe } from "@/components/saas-marketing/pricing/actions/generate-user-stripe"
import { Icons } from "@/components/saas-marketing/pricing/shared/icons"
import {
  SubscriptionPlan,
  UserSubscriptionPlan,
} from "@/components/saas-marketing/pricing/types"

interface BillingFormButtonProps {
  offer: SubscriptionPlan
  subscriptionPlan: UserSubscriptionPlan
  year: boolean
  userRole?: UserRole
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function BillingFormButton({
  year,
  offer,
  subscriptionPlan,
  userRole,
  dictionary,
}: BillingFormButtonProps) {
  const [isPending, startTransition] = useTransition()
  const pricing = dictionary?.marketing?.pricing
  const selectedPriceId = offer.stripeIds[year ? "yearly" : "monthly"]
  const generateUserStripeSession = generateUserStripe.bind(
    null,
    selectedPriceId as string
  )

  const stripeSessionAction = () =>
    startTransition(() => {
      void generateUserStripeSession()
    })

  const userOffer =
    subscriptionPlan.stripePriceId ===
    offer.stripeIds[year ? "yearly" : "monthly"]

  const isAvailable = Boolean(selectedPriceId)

  return (
    <Button
      variant={"default"}
      className=""
      disabled={isPending || !isAvailable}
      onClick={stripeSessionAction}
    >
      {isPending ? (
        <>
          <Icons.spinner className="me-2 size-4 animate-spin" />{" "}
          {pricing?.constants?.loading || "Loading..."}
        </>
      ) : (
        <>
          {!isAvailable
            ? pricing?.constants?.unavailable || "Unavailable"
            : userOffer
              ? pricing?.constants?.manageSubscription || "Manage Subscription"
              : offer.title.toLowerCase() === "pro"
                ? pricing?.constants?.getPro || "Get Pro"
                : offer.title.toLowerCase() === "ultra"
                  ? pricing?.constants?.getUltra || "Get Ultra"
                  : pricing?.constants?.getPlan || "Get plan"}
        </>
      )}
    </Button>
  )
}
