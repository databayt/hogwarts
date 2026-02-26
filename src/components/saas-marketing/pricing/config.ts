// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { env } from "@/env.mjs"
import type {
  PlansRow,
  SubscriptionPlan,
} from "@/components/saas-marketing/pricing/types"

// Type for the pricing section of the dictionary
type PricingDict =
  | {
      constants?: {
        free?: string
        includes?: string
        everythingInHobby?: string
        everythingInPro?: string
        startTrial?: string
        getPro?: string
        getUltra?: string
        monthly?: string
        yearly?: string
        perMonth?: string
        moreInfo?: string
        loading?: string
        unavailable?: string
        manageSubscription?: string
        getPlan?: string
      }
      plans?: {
        hobby?: { title?: string; description?: string; benefits?: string[] }
        pro?: { title?: string; description?: string; benefits?: string[] }
        ultra?: { title?: string; description?: string; benefits?: string[] }
      }
    }
  | undefined

export const isProTitle = (title: string): boolean =>
  title.toLowerCase() === "pro"

export const isStarterTitle = (title: string): boolean =>
  title.toLowerCase() === "hobby"

export const getIncludesHeading = (
  title: string,
  pricing?: PricingDict
): string =>
  isStarterTitle(title)
    ? pricing?.constants?.includes || "Includes"
    : isProTitle(title)
      ? pricing?.constants?.everythingInHobby || "Everything in Hobby, plus"
      : pricing?.constants?.everythingInPro || "Everything in Pro, plus"

export const getCtaLabel = (title: string, pricing?: PricingDict): string =>
  isStarterTitle(title)
    ? pricing?.constants?.startTrial || "Start trial"
    : isProTitle(title)
      ? pricing?.constants?.getPro || "Get Pro"
      : pricing?.constants?.getUltra || "Get Ultra"

export const getPriceDisplay = (
  offer: SubscriptionPlan,
  isYearly: boolean,
  pricing?: PricingDict
): string => {
  if (offer.prices.monthly === 0) return pricing?.constants?.free || "Free"
  if (isYearly) {
    const discountedPerMonth = offer.prices.monthly * 0.8
    return `$${discountedPerMonth}`
  }
  return `$${offer.prices.monthly}`
}

export const getYearlyTotal = (offer: SubscriptionPlan): number => {
  if (offer.prices.monthly === 0) return 0
  return offer.prices.monthly * 12 * 0.8
}

// Default pricing data (fallback when no dictionary)
export const pricingData: SubscriptionPlan[] = [
  {
    title: "Hobby",
    description: "Get started for free",
    benefits: ["Up to 100 students", "Up to 10 teachers", "Core features"],
    limitations: [],
    prices: {
      monthly: 0,
      yearly: 0,
    },
    stripeIds: {
      monthly: null,
      yearly: null,
    },
  },
  {
    title: "Pro",
    description: "For growing schools",
    benefits: [
      "Up to 500 students",
      "Unlimited teachers",
      "Advanced reports and exports",
      "Custom branding",
    ],
    limitations: [],
    prices: {
      monthly: 20,
      yearly: 192,
    },
    stripeIds: {
      monthly: env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID ?? null,
      yearly: env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID ?? null,
    },
  },
  {
    title: "Ultra",
    description: "For large organizations",
    benefits: ["Unlimited students and teachers", "Custom integrations"],
    limitations: [],
    prices: {
      monthly: 200,
      yearly: 1920,
    },
    stripeIds: {
      monthly:
        env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID ??
        env.NEXT_PUBLIC_STRIPE_ULTRA_MONTHLY_PLAN_ID ??
        null,
      yearly:
        env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID ??
        env.NEXT_PUBLIC_STRIPE_ULTRA_YEARLY_PLAN_ID ??
        null,
    },
  },
]

// Get pricing data with dictionary translations applied
export const getPricingData = (pricing?: PricingDict): SubscriptionPlan[] => {
  if (!pricing?.plans) return pricingData

  return pricingData.map((plan) => {
    const key = plan.title.toLowerCase() as "hobby" | "pro" | "ultra"
    const dictPlan = pricing.plans?.[key]
    if (!dictPlan) return plan

    return {
      ...plan,
      title: dictPlan.title || plan.title,
      description: dictPlan.description || plan.description,
      benefits: dictPlan.benefits || plan.benefits,
    }
  })
}

export const plansColumns = ["hobby", "pro", "ultra", "enterprise"] as const

export const comparePlans: PlansRow[] = [
  {
    feature: "Analytics & reporting",
    hobby: true,
    pro: true,
    ultra: true,
    enterprise: "Custom",
    tooltip: "All plans include basic reports; advanced in Pro/Business.",
  },
  {
    feature: "Custom branding",
    hobby: null,
    pro: true,
    ultra: true,
    enterprise: "Unlimited",
    tooltip: "Brand colors and logo available from Pro.",
  },
  {
    feature: "Support",
    hobby: null,
    pro: "Priority",
    ultra: "24/7",
    enterprise: "24/7 Support",
  },
  {
    feature: "Advanced reporting",
    hobby: null,
    pro: null,
    ultra: true,
    enterprise: "Custom",
    tooltip:
      "Advanced reporting is available in Business and Enterprise plans.",
  },
  {
    feature: "Dedicated manager",
    hobby: null,
    pro: null,
    ultra: null,
    enterprise: true,
    tooltip: "Enterprise plan includes a dedicated account manager.",
  },
  {
    feature: "API access",
    hobby: "Limited",
    pro: "Standard",
    ultra: "Enhanced",
    enterprise: "Full",
  },
  {
    feature: "Monthly webinars",
    hobby: false,
    pro: true,
    ultra: true,
    enterprise: "Custom",
    tooltip: "Pro and higher plans include access to monthly webinars.",
  },
  {
    feature: "Custom integrations",
    hobby: false,
    pro: false,
    ultra: "Available",
    enterprise: "Available",
    tooltip:
      "Custom integrations are available in Business and Enterprise plans.",
  },
  {
    feature: "Roles & permissions",
    hobby: null,
    pro: "Basic",
    ultra: "Advanced",
    enterprise: "Advanced",
    tooltip:
      "User roles and permissions management improves with higher plans.",
  },
  {
    feature: "Onboarding assistance",
    hobby: false,
    pro: "Self-service",
    ultra: "Assisted",
    enterprise: "Full Service",
    tooltip: "Higher plans include more comprehensive onboarding assistance.",
  },
]

// Get compare plans with dictionary translations applied
export const getComparePlans = (pricing?: PricingDict): PlansRow[] => {
  // For now, return the default comparePlans since the feature names
  // in the dictionary use a different structure than the current hardcoded data
  return comparePlans
}
