"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { SubscriptionPlan, UserSubscriptionPlan } from "@/components/marketing/pricing/types";
import { BillingFormButton } from "@/components/marketing/pricing/forms/billing-form-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCtaLabel, getIncludesHeading, getPriceDisplay, getYearlyTotal, isStarterTitle, isProTitle } from "./constants";
import { Separator } from "@/components/ui/separator";

interface PricingCardProps {
  offer: SubscriptionPlan;
  isYearly: boolean;
  userId?: string;
  subscriptionPlan?: UserSubscriptionPlan;
  userRole?: string;
}

export function PricingCard({ offer, isYearly, userId, subscriptionPlan, userRole }: PricingCardProps) {
  const isPro = isProTitle(offer.title);
  const isStarter = isStarterTitle(offer.title);
  const priceDisplay = getPriceDisplay(offer, isYearly);

  const ctaArea = (
    <>
      {userId && subscriptionPlan ? (
        isStarter ? (
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "default" }),
              
            )}
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
            const monthly = offer.stripeIds.monthly;
            const yearly = offer.stripeIds.yearly;
            const priceId = (isYearly ? yearly : monthly) || monthly;
            return priceId
              ? `/starter/dashboard/billing/checkout?price=${encodeURIComponent(priceId)}`
              : `/starter/dashboard/billing`;
          })()}
          className={cn(
            buttonVariants({
              variant: "default",
              size: "sm",
            }),
            "hover:scale-[1.01] transition-transform rounded-full",
          )}
        >
          {getCtaLabel(offer.title)}
        </Link>
      )}
      {(!userId || !subscriptionPlan) && isPro && (
        <a href="#more-info" className="ml-3 text-sm text-muted-foreground">
          More info ↗
        </a>
      )}
    </>
  );

  const includesHeading = getIncludesHeading(offer.title);

  return (
    <Card
      key={offer.title}
      className={cn(
        "relative overflow-hidden rounded-2xl border-none  shadow-none bg-muted text-card-foreground flex flex-col items-start text-left h-full w-full",
      )}
    >
      <CardHeader className="">
        <p className="text-lg text-foreground">{offer.title}</p>
        <CardTitle className="text-4xl font-bold tracking-tight">
          {priceDisplay}
          <span className="text-lg font-light text-muted-foreground ml-1">
            {offer.prices.monthly > 0 ? "/mo" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <div className="w-full px-6">
        <Separator />
      </div>

      <CardContent className=" flex-1">
        <p className="text-sm font-semibold text-muted-foreground mb-2">{includesHeading}</p>
        <ul>
          {offer.benefits.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="mt-1 text-primary size-3" />
              <span className="text-xs leading-6">{feature}</span>
            </li>
          ))}
          {/* limitations intentionally not rendered */}
        </ul>
      </CardContent>

      <CardFooter className="">{ctaArea}</CardFooter>
    </Card>
  );
}

