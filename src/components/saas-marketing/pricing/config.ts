// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// SaaS plan data: what each plan includes. What a student costs lives in
// rates.ts — one rate (24 SAR a year) for every student, from the first, on
// every plan. The "free" plan id is the free first month (TRIAL_MONTHS): the
// whole product, before the first payment. The dictionary overlays display
// text only.

import { env } from "@/env.mjs"
import type {
  PlanId,
  PlansRow,
  SubscriptionPlan,
} from "@/components/saas-marketing/pricing/types"

import { FALLBACK_RATES, RATE_SAR_PER_STUDENT_YEAR } from "./rates"

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
      ? pricing?.constants?.getPro || "Start with a free month"
      : pricing?.constants?.startTrial || "Start your free month"

// Legacy USD unit for the Stripe subscription code (billing-form-button,
// lib/subscription): one billable student per month at today's SAR peg.
// The page, calculator and chatbot price from rates.ts, never from this.
const PER_STUDENT_USD_MONTH =
  Math.round(((RATE_SAR_PER_STUDENT_YEAR * FALLBACK_RATES.USD) / 12) * 10000) /
  10000

export const pricingData: SubscriptionPlan[] = [
  {
    // lib/subscription.ts falls back to pricingData[0] — Free stays first.
    id: "free",
    title: "Free month",
    description: "Try everything for one month",
    benefits: [
      "Everything in Pro for one month",
      "We set up your school with you",
      "No payment until the month ends",
      "Your data stays yours",
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
      "Every student, 24 SAR a year",
      "Unlimited teachers",
      "Custom branding",
      "Parent push notifications",
      "WhatsApp & email support",
    ],
    limitations: [],
    prices: {
      monthly: PER_STUDENT_USD_MONTH,
      yearly: PER_STUDENT_USD_MONTH,
    },
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
    // Displayed as "Ultra"; the id stays "enterprise" for Stripe + subscription.
    title: "Ultra",
    description: "For networks and large institutions",
    benefits: [
      "Multi-campus networks",
      "Dedicated account manager",
      "White-label branding",
      "SSO (SAML/OAuth)",
      "Custom integrations & API",
    ],
    limitations: [],
    prices: {
      monthly: PER_STUDENT_USD_MONTH,
      yearly: PER_STUDENT_USD_MONTH,
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
    free: "All, for one month",
    pro: "Unlimited, billed per student",
    enterprise: "1,000+ (custom)",
    tooltip:
      "Every new school gets one free month. After it, every student is 24 SAR a year, on every plan.",
  },
  {
    feature: "Teachers",
    free: "Unlimited",
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
    free: "10 GB",
    pro: "10 GB",
    enterprise: "Unlimited",
  },
  {
    feature: "Support",
    free: "WhatsApp & email",
    pro: "WhatsApp & email",
    enterprise: "Dedicated account manager",
  },
  {
    feature: "Custom branding",
    free: true,
    pro: true,
    enterprise: "Yes, white-label",
  },
  {
    feature: "API access",
    free: "1,000 req/hr",
    pro: "1,000 req/hr",
    enterprise: "Unlimited",
    tooltip: "Pro and the free month are rate-limited; Ultra is unlimited.",
  },
  {
    feature: "Parent push notifications",
    free: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "SSO (SAML/OAuth)",
    free: null,
    pro: null,
    enterprise: true,
    tooltip: "Single sign-on via SAML or OAuth — Ultra only.",
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
  "All, for one month": "allForMonth",
  "Up to 100": "upTo100",
  "Unlimited, billed per student": "unlimitedPerStudent",
  "1,000+ (custom)": "students1000Plus",
  Unlimited: "unlimited",
  "Up to 10": "upTo10",
  "1 GB": "oneGb",
  "10 GB": "tenGb",
  Community: "community",
  "WhatsApp & email": "priority",
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
