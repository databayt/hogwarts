"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import Link from "next/link"
import { UserRole } from "@prisma/client"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { generateUserStripe } from "@/components/saas-marketing/pricing/actions/generate-user-stripe"
import { Icons } from "@/components/saas-marketing/pricing/shared/icons"
import {
  SubscriptionPlan,
  UserSubscriptionPlan,
} from "@/components/saas-marketing/pricing/types"

import { isProPlan } from "../config"

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

  // No Stripe price configured for this plan — a disabled "Unavailable"
  // button dead-ends the page, so route the intent to sales instead.
  if (!isAvailable) {
    return (
      <Link
        href={
          pricing?.enterprise?.contactHref ||
          "mailto:contact@databayt.org?subject=Upgrade"
        }
        className={cn(buttonVariants({ variant: "default" }))}
      >
        {pricing?.constants?.contactToUpgrade || "Contact us to upgrade"}
      </Link>
    )
  }

  return (
    <Button
      variant={"default"}
      className=""
      disabled={isPending}
      onClick={stripeSessionAction}
    >
      {isPending ? (
        <>
          <Icons.spinner className="me-2 size-4 animate-spin" />{" "}
          {pricing?.constants?.loading || "Loading..."}
        </>
      ) : (
        <>
          {userOffer
            ? pricing?.constants?.manageSubscription || "Manage Subscription"
            : isProPlan(offer.id)
              ? pricing?.constants?.getPro || "Get Pro"
              : pricing?.constants?.getPlan || "Get plan"}
        </>
      )}
    </Button>
  )
}
