/**
 * BillingSDK Configuration
 *
 * Maps existing Hogwarts pricing data to BillingSDK component interfaces.
 * Used by all BillingSDK components in the school-dashboard billing page.
 */

import { env } from "@/env.mjs"

// ========== BillingSDK Interfaces ==========

export interface Plan {
  id: string
  title: string
  description: string
  highlight?: boolean
  type?: "monthly" | "yearly"
  currency?: string
  monthlyPrice: string
  yearlyPrice: string
  buttonText: string
  badge?: string
  features: {
    name: string
    icon: string
    iconColor?: string
  }[]
  stripeIds?: {
    monthly: string | null
    yearly: string | null
  }
  limits?: {
    students: number
    teachers: number
    classes: number
    storage: number
  }
}

export interface CurrentPlan {
  plan: Plan
  type: "monthly" | "yearly" | "custom"
  price?: string
  nextBillingDate: string
  paymentMethod: string
  status: "active" | "inactive" | "past_due" | "cancelled"
}

export interface InvoiceItem {
  id: string
  date: string
  amount: string
  status: "paid" | "refunded" | "open" | "void"
  invoiceUrl?: string
  description?: string
}

export interface UsageResource {
  name: string
  used: number
  limit: number
  percentage?: number
  unit: string
}

export interface ChargeItem {
  id: string
  description: string
  amount: string
  date: string
  type: "prorated" | "recurring" | "one-time"
}

export interface PaymentCard {
  id: string
  last4: string
  brand: string
  expiry: string
  primary: boolean
}

// ========== Hogwarts Plans Configuration ==========

export const plans: Plan[] = [
  {
    id: "hobby",
    title: "Hobby",
    description: "Get started for free",
    currency: "$",
    monthlyPrice: "0",
    yearlyPrice: "0",
    buttonText: "Start trial",
    features: [
      {
        name: "Up to 100 students",
        icon: "check",
        iconColor: "text-green-500",
      },
      {
        name: "Up to 10 teachers",
        icon: "check",
        iconColor: "text-green-500",
      },
      {
        name: "Core features",
        icon: "check",
        iconColor: "text-blue-500",
      },
      {
        name: "Basic analytics",
        icon: "check",
        iconColor: "text-blue-500",
      },
      {
        name: "Community support",
        icon: "check",
        iconColor: "text-gray-500",
      },
    ],
    stripeIds: {
      monthly: null,
      yearly: null,
    },
    limits: {
      students: 100,
      teachers: 10,
      classes: 20,
      storage: 1000, // 1GB
    },
  },
  {
    id: "pro",
    title: "Pro",
    description: "For growing schools",
    currency: "$",
    monthlyPrice: "20",
    yearlyPrice: "192",
    buttonText: "Get Pro",
    badge: "Most popular",
    highlight: true,
    features: [
      {
        name: "Up to 500 students",
        icon: "check",
        iconColor: "text-green-500",
      },
      {
        name: "Unlimited teachers",
        icon: "check",
        iconColor: "text-green-500",
      },
      {
        name: "Advanced reports and exports",
        icon: "check",
        iconColor: "text-blue-500",
      },
      {
        name: "Custom branding",
        icon: "check",
        iconColor: "text-purple-500",
      },
      {
        name: "Priority support",
        icon: "check",
        iconColor: "text-orange-500",
      },
    ],
    stripeIds: {
      monthly: env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID ?? null,
      yearly: env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID ?? null,
    },
    limits: {
      students: 500,
      teachers: -1, // unlimited
      classes: 100,
      storage: 5000, // 5GB
    },
  },
  {
    id: "ultra",
    title: "Ultra",
    description: "For large organizations",
    currency: "$",
    monthlyPrice: "200",
    yearlyPrice: "1920",
    buttonText: "Get Ultra",
    features: [
      {
        name: "Unlimited students and teachers",
        icon: "check",
        iconColor: "text-green-500",
      },
      {
        name: "Custom integrations",
        icon: "check",
        iconColor: "text-purple-500",
      },
      {
        name: "Advanced analytics",
        icon: "check",
        iconColor: "text-blue-500",
      },
      {
        name: "White-label options",
        icon: "check",
        iconColor: "text-purple-500",
      },
      {
        name: "24/7 dedicated support",
        icon: "check",
        iconColor: "text-orange-500",
      },
    ],
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
    limits: {
      students: -1, // unlimited
      teachers: -1, // unlimited
      classes: -1, // unlimited
      storage: 50000, // 50GB
    },
  },
]

// ========== Helper Functions ==========

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): Plan | undefined {
  return plans.find((p) => p.id === planId)
}

/**
 * Get plan index in array
 */
export function getPlanIndex(planId: string): number {
  return plans.findIndex((p) => p.id === planId)
}

/**
 * Format price for display
 */
export function formatPlanPrice(
  price: string | number,
  currency = "$"
): string {
  if (price === "0" || price === 0) return "Free"
  if (typeof price === "string" && isNaN(Number(price))) return price
  return `${currency}${price}`
}

/**
 * Get yearly savings percentage
 */
export function getYearlySavings(monthlyPrice: number): number {
  // 20% savings for annual billing
  return 20
}

/**
 * Get monthly equivalent of yearly price
 */
export function getMonthlyFromYearly(yearlyPrice: number): number {
  return Math.round(yearlyPrice / 12)
}
