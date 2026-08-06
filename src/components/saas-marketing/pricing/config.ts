// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Single source of truth for SaaS plan data. Per-student pricing:
// Free ($0, ≤100 students) · Pro ($1.50/student/mo, $30/mo minimum) ·
// Enterprise ($1.00/student/mo reference, custom-quoted for 1,000+).
// Yearly unit prices are the 20%-off rates. The dictionary overlays
// display text only — ids and numbers live here.

import { env } from "@/env.mjs"
import type {
  PlanId,
  PlansRow,
  SubscriptionPlan,
} from "@/components/saas-marketing/pricing/types"

// Type for the pricing section of the dictionary
type PricingDict =
  | {
      constants?: {
        free?: string
        custom?: string
        includes?: string
        everythingInFree?: string
        everythingInPro?: string
        startTrial?: string
        getPro?: string
        monthly?: string
        yearly?: string
        perMonth?: string
        perStudentPerMonth?: string
        minimumNote?: string
        billedAnnuallyNote?: string
        contactToUpgrade?: string
        moreInfo?: string
        loading?: string
        unavailable?: string
        manageSubscription?: string
        getPlan?: string
      }
      plans?: {
        free?: { title?: string; description?: string; benefits?: string[] }
        pro?: { title?: string; description?: string; benefits?: string[] }
        enterprise?: {
          title?: string
          description?: string
          benefits?: string[]
        }
      }
      enterprise?: {
        talkToSales?: string
        contactHref?: string
      }
      comparePlans?: {
        features?: Record<string, string>
        values?: Record<string, string>
        tooltips?: Record<string, string>
      }
    }
  | undefined

export const isFreePlan = (id: PlanId): boolean => id === "free"
export const isProPlan = (id: PlanId): boolean => id === "pro"
export const isEnterprisePlan = (id: PlanId): boolean => id === "enterprise"

export const getIncludesHeading = (
  id: PlanId,
  pricing?: PricingDict
): string =>
  isFreePlan(id)
    ? pricing?.constants?.includes || "Includes"
    : isProPlan(id)
      ? pricing?.constants?.everythingInFree || "Everything in Free, plus"
      : pricing?.constants?.everythingInPro || "Everything in Pro, plus"

export const getCtaLabel = (id: PlanId, pricing?: PricingDict): string =>
  isEnterprisePlan(id)
    ? pricing?.enterprise?.talkToSales || "Talk to Sales"
    : isProPlan(id)
      ? pricing?.constants?.getPro || "Get Pro"
      : pricing?.constants?.startTrial || "Get started free"

export const getPriceDisplay = (
  offer: SubscriptionPlan,
  isYearly: boolean,
  pricing?: PricingDict
): string => {
  if (isEnterprisePlan(offer.id)) return pricing?.constants?.custom || "Custom"
  // "$0" not "Free" — the card title already says Free; repeating it reads odd.
  if (offer.prices.monthly === 0) return "$0"
  const unit = isYearly ? offer.prices.yearly : offer.prices.monthly
  return `$${unit.toFixed(2)}`
}

/** Per-student ANNUAL unit rate when billed yearly (e.g. Pro: $14.40). */
export const getYearlyTotal = (offer: SubscriptionPlan): number => {
  if (isFreePlan(offer.id) || isEnterprisePlan(offer.id)) return 0
  return offer.prices.yearly * 12
}

/**
 * Monthly cost for a given student count — shared by the pricing card's
 * minimum-note math and the calculator. Applies the plan's monthly floor.
 */
export const getMonthlyCost = (
  offer: SubscriptionPlan,
  studentCount: number,
  isYearly: boolean
): number => {
  if (isFreePlan(offer.id)) return 0
  const unit = isYearly ? offer.prices.yearly : offer.prices.monthly
  const raw = unit * studentCount
  return offer.minimumMonthly ? Math.max(raw, offer.minimumMonthly) : raw
}

// Default pricing data (fallback when no dictionary)
export const pricingData: SubscriptionPlan[] = [
  {
    // lib/subscription.ts falls back to pricingData[0] — Free stays first.
    id: "free",
    title: "Free",
    description: "Great for small schools getting started",
    benefits: [
      "Up to 100 students",
      "Up to 10 teachers",
      "Core features — admissions, attendance, exams, fees, timetable",
      "1 GB storage",
      "Community support",
    ],
    limitations: [],
    prices: {
      monthly: 0,
      yearly: 0,
    },
    stripeIds: {
      monthly: null,
      yearly: null,
    },
    studentRange: { min: 0, max: 100 },
  },
  {
    id: "pro",
    title: "Pro",
    description: "For growing schools ready to scale",
    benefits: [
      "Unlimited students, billed per student",
      "Unlimited teachers",
      "10 GB storage",
      "Priority support",
      "Custom branding",
      "Advanced analytics & parent push notifications",
    ],
    limitations: [],
    prices: {
      monthly: 1.5,
      yearly: 1.2,
    },
    minimumMonthly: 30,
    stripeIds: {
      monthly: env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID ?? null,
      yearly: env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID ?? null,
    },
    studentRange: { min: 1, max: null },
  },
  {
    id: "enterprise",
    // The card headline renders "Custom" (see getPriceDisplay), but these
    // unit prices are REAL consumers' inputs: the chatbot quotes them and the
    // calculator estimates from them. Don't remove them as "unused".
    title: "Enterprise",
    description: "For networks and government contracts, 1,000+ students",
    benefits: [
      "Unlimited storage & API",
      "Dedicated account manager",
      "99.9% uptime SLA",
      "White-label branding",
      "SSO (SAML/OAuth)",
      "Custom integrations",
    ],
    limitations: [],
    prices: {
      monthly: 1.0,
      yearly: 0.8,
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
    studentRange: { min: 1000, max: null },
  },
]

// Get pricing data with dictionary translations applied
export const getPricingData = (pricing?: PricingDict): SubscriptionPlan[] => {
  if (!pricing?.plans) return pricingData

  return pricingData.map((plan) => {
    const dictPlan = pricing.plans?.[plan.id]
    if (!dictPlan) return plan

    return {
      // id spreads from ...plan and is never overwritten — CTA branching
      // stays correct in every locale.
      ...plan,
      title: dictPlan.title || plan.title,
      description: dictPlan.description || plan.description,
      benefits: dictPlan.benefits || plan.benefits,
    }
  })
}

export const plansColumns = ["free", "pro", "enterprise"] as const

export const comparePlans: PlansRow[] = [
  {
    feature: "Students included",
    free: "Up to 100",
    pro: "Unlimited, billed per student",
    enterprise: "1,000+ (custom)",
    tooltip:
      "Free is capped at 100 students. Pro and Enterprise bill per student with no hard cap.",
  },
  {
    feature: "Teachers",
    free: "Up to 10",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Admissions, attendance, exams, fees, timetable, messaging",
    free: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Storage",
    free: "1 GB",
    pro: "10 GB",
    enterprise: "Unlimited",
  },
  {
    feature: "Support",
    free: "Community",
    pro: "Priority",
    enterprise: "Dedicated account manager",
  },
  {
    feature: "Custom branding",
    free: null,
    pro: true,
    enterprise: "Yes, white-label",
  },
  {
    feature: "API access",
    free: null,
    pro: "1,000 req/hr",
    enterprise: "Unlimited",
    tooltip:
      "Free has no API access. Pro is rate-limited; Enterprise is unlimited.",
  },
  {
    feature: "Analytics & reporting",
    free: "Basic",
    pro: "Advanced",
    enterprise: "Advanced + custom",
  },
  {
    feature: "Parent push notifications",
    free: null,
    pro: true,
    enterprise: true,
  },
  {
    feature: "SSO (SAML/OAuth)",
    free: null,
    pro: null,
    enterprise: true,
    tooltip: "Single sign-on via SAML or OAuth — Enterprise only.",
  },
  {
    feature: "Uptime SLA",
    free: null,
    pro: null,
    enterprise: "99.9%",
    tooltip: "Enterprise includes a contractual 99.9% uptime guarantee.",
  },
  {
    feature: "Data export, anytime",
    free: true,
    pro: true,
    enterprise: true,
  },
]

// Maps the canonical English row data to dictionary keys so the compare
// table can be rendered in the active locale.
const compareFeatureKeys: Record<string, string> = {
  "Students included": "students",
  Teachers: "teachers",
  "Admissions, attendance, exams, fees, timetable, messaging": "coreModules",
  Storage: "storage",
  Support: "support",
  "Custom branding": "customBranding",
  "API access": "apiAccess",
  "Analytics & reporting": "analyticsReporting",
  "Parent push notifications": "parentNotifications",
  "SSO (SAML/OAuth)": "sso",
  "Uptime SLA": "sla",
  "Data export, anytime": "dataExport",
}

const compareValueKeys: Record<string, string> = {
  "Up to 100": "upTo100",
  "Unlimited, billed per student": "unlimitedPerStudent",
  "1,000+ (custom)": "students1000Plus",
  Unlimited: "unlimited",
  "Up to 10": "upTo10",
  "1 GB": "oneGb",
  "10 GB": "tenGb",
  Community: "community",
  Priority: "priority",
  "Dedicated account manager": "dedicatedAm",
  Basic: "basic",
  Advanced: "advanced",
  "Advanced + custom": "advancedPlus",
  "1,000 req/hr": "rateLimited",
  "99.9%": "sla999",
  "Yes, white-label": "whiteLabel",
}

// Get compare plans with dictionary translations applied
export const getComparePlans = (pricing?: PricingDict): PlansRow[] => {
  const compare = pricing?.comparePlans
  if (!compare) return comparePlans

  const translateValue = (
    value: string | boolean | null
  ): string | boolean | null => {
    if (typeof value !== "string") return value
    const key = compareValueKeys[value]
    return (key && compare.values?.[key]) || value
  }

  return comparePlans.map((row) => {
    const featureKey = compareFeatureKeys[row.feature]
    return {
      ...row,
      feature: (featureKey && compare.features?.[featureKey]) || row.feature,
      tooltip: row.tooltip
        ? (featureKey && compare.tooltips?.[featureKey]) || row.tooltip
        : row.tooltip,
      free: translateValue(row.free),
      pro: translateValue(row.pro),
      enterprise: translateValue(row.enterprise),
    }
  })
}
