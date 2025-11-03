import Link from "next/link";
import * as React from "react";

import { CustomerPortalButton } from "@/components/platform/admin/billing/customer-portal-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDate } from "@/components/marketing/pricing/lib/utils";
import { UserSubscriptionPlan } from "@/components/marketing/pricing/types";
import type { Locale } from "@/components/internationalization/config";

interface BillingInfoProps extends React.HTMLAttributes<HTMLFormElement> {
  userSubscriptionPlan: UserSubscriptionPlan;
  lang?: Locale;
}

export function BillingInfo({ userSubscriptionPlan, lang }: BillingInfoProps) {
  const {
    title,
    description,
    stripeCustomerId,
    isPaid,
    isCanceled,
    stripeCurrentPeriodEnd,
  } = userSubscriptionPlan;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Plan</CardTitle>
        <CardDescription>
          You are currently on the <strong>{title}</strong> plan.
        </CardDescription>
      </CardHeader>
      <CardContent>{description}</CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 border-t bg-accent py-2 md:flex-row md:justify-between md:space-y-0">
        {isPaid ? (
          <p className="muted">
            {isCanceled
              ? "Your plan will be canceled on "
              : "Your plan renews on "}
            {formatDate(stripeCurrentPeriodEnd)}.
          </p>
        ) : null}

        {isPaid && stripeCustomerId ? (
          <CustomerPortalButton userStripeId={stripeCustomerId as string} />
        ) : (
          <Link href={`/${lang}/pricing`} className={cn(buttonVariants())}>
            Choose a plan
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
