// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { QuickAction } from "@/components/school-dashboard/dashboard/quick-actions"

/**
 * SaaS-specific quick actions for the operator dashboard.
 * Uses the same QuickAction interface as school dashboard for component reuse.
 */
export const saasQuickActions: QuickAction[] = [
  {
    iconName: "Building",
    label: "Add Tenant",
    description: "Create a new school tenant",
    href: "/tenants",
  },
  {
    iconName: "DollarSign",
    label: "View Billing",
    description: "Manage subscriptions and invoices",
    href: "/billing",
  },
  {
    iconName: "Globe",
    label: "Manage Domains",
    description: "Configure custom domains",
    href: "/domains",
  },
  {
    iconName: "BarChart",
    label: "View Analytics",
    description: "Platform analytics and metrics",
    href: "/analytics",
  },
]
