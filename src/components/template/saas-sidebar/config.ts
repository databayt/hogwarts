// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

type IconKey = keyof typeof import("./icons").Icons

export type PlatformNavItem = {
  title: string
  href: string
  icon: IconKey
  className?: string
}

export const platformNav: PlatformNavItem[] = [
  // SaaS operator navigation – DEVELOPER role only
  { title: "Overview", href: "/dashboard", icon: "pieChart" },
  { title: "Analytics", href: "/analytics", icon: "trendingUp" },
  { title: "Sales", href: "/sales", icon: "sales" },
  { title: "Kanban", href: "/kanban", icon: "checkCircle" },
  { title: "Products", href: "/product", icon: "file" },
  { title: "Domains", href: "/domains", icon: "browser" },
  { title: "Billing", href: "/billing", icon: "pieChart" },
  { title: "Observability", href: "/observability", icon: "barChart" },
  { title: "Catalog", href: "/catalog", icon: "bookOpen" },
  { title: "Tenants", href: "/tenants", icon: "building" },
  { title: "Users", href: "/users", icon: "users" },
]
