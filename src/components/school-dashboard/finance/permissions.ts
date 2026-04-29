// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Role } from "@/lib/rbac/types"
import {
  ADMIN_ROLES,
  FINANCE_WRITE_ROLES,
  FULL_UI_PERMISSIONS,
  isRoleIn,
  NO_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import type { PageNavItem } from "@/components/atom/page-nav"

const FINANCE_VIEW_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "ACCOUNTANT",
] as const

const FEES_VIEW_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "ACCOUNTANT",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
  "TEACHER",
] as const

/** Finance root navigation — primary tabs only for ACCOUNTANT/ADMIN/DEVELOPER. */
export function getFinanceRootTabs(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, any>
): PageNavItem[] {
  const isFinance = isRoleIn(role, FINANCE_WRITE_ROLES)
  const nav = d?.navigation
  const base = `/${lang}/finance`

  if (!isFinance) {
    return [
      { name: nav?.overview || "Overview", href: base },
      { name: nav?.fees || "Fees", href: `${base}/fees` },
    ]
  }

  return [
    { name: nav?.overview || "Overview", href: base },
    { name: nav?.invoice || "Invoice", href: `${base}/invoice` },
    { name: nav?.banking || "Banking", href: `${base}/banking` },
    { name: nav?.fees || "Fees", href: `${base}/fees` },
    { name: nav?.salary || "Salary", href: `${base}/salary` },
    { name: nav?.payroll || "Payroll", href: `${base}/payroll` },
    { name: nav?.reports || "Reports", href: `${base}/reports` },
    { name: nav?.receipt || "Receipt", href: `${base}/receipt`, hidden: true },
    {
      name: nav?.timesheet || "Timesheet",
      href: `${base}/timesheet`,
      hidden: true,
    },
    { name: nav?.wallet || "Wallet", href: `${base}/wallet`, hidden: true },
    { name: nav?.budget || "Budget", href: `${base}/budget`, hidden: true },
    {
      name: nav?.expenses || "Expenses",
      href: `${base}/expenses`,
      hidden: true,
    },
    {
      name: nav?.accounts || "Accounts",
      href: `${base}/accounts`,
      hidden: true,
    },
  ]
}

/** Fees feature tabs — admins get full pipeline, others get "My Fees". */
export function getFeesTabs(
  role: Role | null | undefined,
  lang: string,
  d?: Record<string, any>
): PageNavItem[] {
  if (!isRoleIn(role, FEES_VIEW_ROLES)) return []
  const n = d?.navigation
  const base = `/${lang}/finance/fees`
  const isAdmin = isRoleIn(role, ADMIN_ROLES) || role === "ACCOUNTANT"

  if (!isAdmin) {
    return [{ name: n?.myFees || "My Fees", href: `${base}/my` }]
  }
  return [
    { name: n?.overview || "Overview", href: base },
    { name: n?.feeStructure || "Fee Structures", href: `${base}/structures` },
    { name: n?.assignments || "Assignments", href: `${base}/assignments` },
    { name: n?.payments || "Payments", href: `${base}/payments` },
    { name: n?.scholarships || "Scholarships", href: `${base}/scholarships` },
    { name: n?.fines || "Fines", href: `${base}/fines` },
    { name: n?.reports || "Reports", href: `${base}/reports` },
  ]
}

interface SubModuleNavConfig {
  /** Sub-route segments under /finance/{module}/{...} */
  tabs: { key: string; segment: string; defaultLabel: string }[]
}

/** Generic finance sub-module tab builder for ACCOUNTANT/ADMIN/DEVELOPER. */
export function buildFinanceSubTabs(
  role: Role | null | undefined,
  lang: string,
  module: string,
  config: SubModuleNavConfig,
  d?: Record<string, any>
): PageNavItem[] {
  if (!isRoleIn(role, FINANCE_WRITE_ROLES)) return []
  const base = `/${lang}/finance/${module}`
  const nav = d?.navigation || d
  return config.tabs.map((t) => ({
    name: nav?.[t.key] || t.defaultLabel,
    href: t.segment ? `${base}/${t.segment}` : base,
  }))
}

/**
 * UIPermissions for finance toolbars/columns.
 * ADMIN/DEVELOPER/ACCOUNTANT: full Add/Edit/Delete/Export.
 * Everyone else: read-only on My Fees.
 */
export function getUIConfigForRole(
  role: Role | null | undefined
): UIPermissions {
  if (!role) return NO_UI_PERMISSIONS
  if (isRoleIn(role, FINANCE_WRITE_ROLES)) return FULL_UI_PERMISSIONS
  return {
    ...NO_UI_PERMISSIONS,
    readOnlyMode: true,
  }
}

export { FINANCE_VIEW_ROLES, FEES_VIEW_ROLES }
