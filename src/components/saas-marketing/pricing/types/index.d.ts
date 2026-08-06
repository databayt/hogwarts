import { User } from "@prisma/client"
import type { Icon } from "lucide-react"

import { Icons } from "../shared/icons"

export type SiteConfig = {
  name: string
  description: string
  url: string
  ogImage: string
  mailSupport: string
  links: {
    twitter: string
    github: string
  }
}

export type NavItem = {
  title: string
  href: string
  badge?: number
  disabled?: boolean
  external?: boolean
  authorizeOnly?: UserRole
  icon?: keyof typeof Icons
}

export type MainNavItem = NavItem

export type MarketingConfig = {
  mainNav: MainNavItem[]
}

export type SidebarNavItem = {
  title: string
  items: NavItem[]
  authorizeOnly?: UserRole
  icon?: keyof typeof Icons
}

export type DocsConfig = {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

// subcriptions
/** Stable plan identifier — never overlaid by the dictionary. */
export type PlanId = "free" | "pro" | "enterprise"

export type SubscriptionPlan = {
  id: PlanId
  title: string
  description: string
  benefits: string[]
  limitations: string[]
  /** Per-student unit price in USD/month; yearly = 20%-off unit when billed annually. */
  prices: {
    monthly: number
    yearly: number
  }
  /** Monthly floor for per-student plans (Pro: $30). */
  minimumMonthly?: number
  /** Student-count range the plan is designed for; max null = uncapped. */
  studentRange?: {
    min: number
    max: number | null
  }
  stripeIds: {
    monthly: string | null
    yearly: string | null
  }
}

export type UserSubscriptionPlan = SubscriptionPlan &
  Pick<User, "stripeCustomerId" | "stripeSubscriptionId" | "stripePriceId"> & {
    stripeCurrentPeriodEnd: number
    isPaid: boolean
    interval: "month" | "year" | null
    isCanceled?: boolean
  }

// compare plans
export type ColumnType = string | boolean | null | undefined
export type PlansRow = { feature: string; tooltip?: string } & Record<
  PlanId,
  string | boolean | null
>

// landing sections
export type InfoList = {
  icon: keyof typeof Icons
  title: string
  description: string
}

export type InfoLdg = {
  title: string
  image: string
  description: string
  list: InfoList[]
}

export type FeatureLdg = {
  title: string
  description: string
  link: string
  icon: keyof typeof Icons
  image?: string
}

export type TestimonialType = {
  name: string
  job: string
  image: string
  review: string
}
