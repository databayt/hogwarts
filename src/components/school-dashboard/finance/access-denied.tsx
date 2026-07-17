// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { FinanceModule } from "./lib/permissions"

/**
 * Per-module key under finance.common. Modules without a dedicated string fall
 * back to the generic finance.common.noPermissionView.
 */
const DENIED_KEY: Partial<Record<FinanceModule, string>> = {
  invoice: "noPermissionInvoices",
  fees: "noPermissionFees",
  salary: "noPermissionSalary",
  payroll: "noPermissionPayroll",
  timesheet: "noPermissionTimesheets",
  wallet: "noPermissionWallet",
  budget: "noPermissionBudget",
  expenses: "noPermissionExpenses",
  accounts: "noPermissionAccounts",
  reports: "noPermissionReports",
}

interface Props {
  dictionary: Dictionary
  module: FinanceModule
}

/**
 * Shown in place of page content when the caller lacks view permission.
 *
 * Renders inline rather than calling redirect(): under Next.js streaming SSR a
 * page renders in parallel with its layout, and a redirect thrown after content
 * has streamed corrupts the RSC payload (see the (school-dashboard) layout).
 */
export function FinanceAccessDenied({ dictionary, module }: Props) {
  const c = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined
  const key = DENIED_KEY[module]

  return (
    <div>
      <p className="text-muted-foreground">
        {(key && c?.[key]) || c?.noPermissionView}
      </p>
    </div>
  )
}
