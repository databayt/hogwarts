import { PlansRow, SubscriptionPlan } from "types";
import { env } from "@/env.mjs";

export const pricingData: SubscriptionPlan[] = [
  {
    title: "Starter",
    description: "Get started for free",
    benefits: [
      "Up to 100 students",
      "Up to 10 teachers",
      "Core features: classes, timetable, attendance",
      "Basic announcements",
    ],
    limitations: [
      "No custom domain",
      "Email-only support",
      "Limited reporting",
    ],
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
      "Priority support",
      "Custom branding",
    ],
    limitations: [],
    prices: {
      monthly: 15,
      yearly: 144,
    },
    stripeIds: {
      monthly: env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID,
      yearly: env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID,
    },
  },
  {
    title: "Ultra",
    description: "For large organizations",
    benefits: [
      "Unlimited students and teachers",
      "Realtime dashboards and advanced analytics",
      "SLA and 24/7 support",
      "Dedicated onboarding and account management",
      "Custom integrations",
    ],
    limitations: [],
    prices: {
      monthly: 30,
      yearly: 300,
    },
    stripeIds: {
      monthly:
        env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID ||
        env.NEXT_PUBLIC_STRIPE_ULTRA_MONTHLY_PLAN_ID,
      yearly:
        env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID ||
        env.NEXT_PUBLIC_STRIPE_ULTRA_YEARLY_PLAN_ID,
    },
  },
];

export const plansColumns = [
  "starter",
  "pro",
  "ultra",
  "enterprise",
] as const;

export const comparePlans: PlansRow[] = [
  {
    feature: "Analytics & reporting",
    starter: true,
    pro: true,
    ultra: true,
    enterprise: "Custom",
    tooltip: "All plans include basic reports; advanced in Pro/Business.",
  },
  {
    feature: "Custom branding",
    starter: null,
    pro: true,
    ultra: true,
    enterprise: "Unlimited",
    tooltip: "Brand colors and logo available from Pro.",
  },
  {
    feature: "Support",
    starter: null,
    pro: "Priority",
    ultra: "24/7",
    enterprise: "24/7 Support",
  },
  {
    feature: "Advanced reporting",
    starter: null,
    pro: null,
    ultra: true,
    enterprise: "Custom",
    tooltip: "Advanced reporting is available in Business and Enterprise plans.",
  },
  {
    feature: "Dedicated manager",
    starter: null,
    pro: null,
    ultra: null,
    enterprise: true,
    tooltip: "Enterprise plan includes a dedicated account manager.",
  },
  {
    feature: "API access",
    starter: "Limited",
    pro: "Standard",
    ultra: "Enhanced",
    enterprise: "Full",
  },
  {
    feature: "Monthly webinars",
    starter: false,
    pro: true,
    ultra: true,
    enterprise: "Custom",
    tooltip: "Pro and higher plans include access to monthly webinars.",
  },
  {
    feature: "Custom integrations",
    starter: false,
    pro: false,
    ultra: "Available",
    enterprise: "Available",
    tooltip: "Custom integrations are available in Business and Enterprise plans.",
  },
  {
    feature: "Roles & permissions",
    starter: null,
    pro: "Basic",
    ultra: "Advanced",
    enterprise: "Advanced",
    tooltip: "User roles and permissions management improves with higher plans.",
  },
  {
    feature: "Onboarding assistance",
    starter: false,
    pro: "Self-service",
    ultra: "Assisted",
    enterprise: "Full Service",
    tooltip: "Higher plans include more comprehensive onboarding assistance.",
  },
  // Add more rows as needed
];
