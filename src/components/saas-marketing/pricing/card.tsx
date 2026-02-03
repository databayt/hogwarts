"use client"

import Link from "next/link"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import { BillingFormButton } from "@/components/saas-marketing/pricing/forms/billing-form-button"
import {
  SubscriptionPlan,
  UserSubscriptionPlan,
} from "@/components/saas-marketing/pricing/types"

import {
  getCtaLabel,
  getIncludesHeading,
  getPriceDisplay,
  getYearlyTotal,
  isProTitle,
  isStarterTitle,
} from "./config"

interface PricingCardProps {
  offer: SubscriptionPlan
  isYearly: boolean
  userId?: string
  subscriptionPlan?: UserSubscriptionPlan
  userRole?: string
  lang?: Locale
}

export function PricingCard({
  offer,
  isYearly,
  userId,
  subscriptionPlan,
  userRole,
  lang,
}: PricingCardProps) {
  const isPro = isProTitle(offer.title)
  const isStarter = isStarterTitle(offer.title)
  const priceDisplay = getPriceDisplay(offer, isYearly)

  const ctaArea = (
    <>
      {userId && subscriptionPlan ? (
        isStarter ? (
          <Link
            href={`/${lang}/dashboard`}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Start trial
          </Link>
        ) : (
          <BillingFormButton
            year={isYearly}
            offer={offer}
            subscriptionPlan={subscriptionPlan}
            userRole={userRole as any}
          />
        )
      ) : (
        <Link
          href={(() => {
            const monthly = offer.stripeIds.monthly
            const yearly = offer.stripeIds.yearly
            const priceId = (isYearly ? yearly : monthly) || monthly
            return priceId
              ? `/${lang}/starter/dashboard/billing/checkout?price=${encodeURIComponent(priceId)}`
              : `/${lang}/starter/dashboard/billing`
          })()}
          className={cn(
            buttonVariants({
              variant: "default",
              size: "sm",
            }),
            "transition-transform hover:scale-[1.01]"
          )}
        >
          {getCtaLabel(offer.title)}
        </Link>
      )}
      {(!userId || !subscriptionPlan) && isPro && (
        <a href="#more-info" className="ms-3">
          <small className="muted">More info ↗</small>
        </a>
      )}
    </>
  )

  const includesHeading = getIncludesHeading(offer.title)

  return (
    <Card
      key={offer.title}
      className={cn(
        "bg-muted text-card-foreground relative flex h-full w-full flex-col items-start overflow-hidden rounded-2xl border-none text-left shadow-none"
      )}
    >
      <CardHeader className="pb-4">
        <p className="lead text-foreground">{offer.title}</p>
        <CardTitle className="tracking-tight">
          {priceDisplay}
          <span className="muted ms-1">
            {offer.prices.monthly > 0 ? "/mo" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <div className="w-full px-6 py-2">
        <Separator />
      </div>

      <CardContent className="flex-1 pt-4">
        <p className="muted mb-2">{includesHeading}</p>
        <ul>
          {offer.benefits.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="text-primary mt-1 size-3" />
              <span className="muted leading-6">{feature}</span>
            </li>
          ))}
          {/* limitations intentionally not rendered */}
        </ul>
      </CardContent>

      <CardFooter className="">{ctaArea}</CardFooter>
    </Card>
  )
}
