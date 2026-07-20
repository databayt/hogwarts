// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getAccount,
  getAccounts,
} from "@/components/school-dashboard/finance/banking/actions/bank.actions"

import { checkFinancePermission } from "../../lib/permissions"
import { DashboardHeader } from "./header"
import { DashboardMainContent } from "./main-content"
import { DashboardSkeleton } from "./skeleton"

interface BankingDashboardContentProps {
  user: any
  searchParams: { id?: string; page?: string }
  dictionary: any
  lang: string
}

export async function BankingDashboardContent({
  user,
  searchParams,
  dictionary,
  lang,
}: BankingDashboardContentProps) {
  const fd = (dictionary as any)?.finance
  const bd = fd?.bankingDashboard as Record<string, string> | undefined

  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <EmptyState>
        {bd?.schoolContextNotFound || "School context not found"}
      </EmptyState>
    )
  }

  // Check permissions for current user
  const canView = await checkFinancePermission(
    user.id,
    schoolId,
    "banking",
    "view"
  )

  // If user can't view banking, show permission denied
  if (!canView) {
    return (
      <EmptyState>
        {bd?.noPermissionBanking || "You don't have permission to view banking"}
      </EmptyState>
    )
  }

  const currentPage = Number(searchParams?.page) || 1

  // Money is rendered in the school's own currency -- never a hardcoded symbol.
  // `username` is fetched here because the session carries no display name
  // (the User model has no `name` column), which made the greeting fall through
  // to "Guest" for every user.
  const [accountsResult, school, profile] = await Promise.all([
    getAccounts({ userId: user.id }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
    db.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    }),
  ])
  const currency = school?.currency ?? "USD"

  // Handle error or no accounts
  if (
    !accountsResult.success ||
    !accountsResult.data?.data ||
    accountsResult.data.data.length === 0
  ) {
    return (
      <EmptyState>
        {bd?.noAccountsFound ||
          "No accounts found. Please connect a bank account."}
      </EmptyState>
    )
  }

  const accounts = accountsResult.data
  const accountsData = accounts.data
  const accountId = searchParams?.id || accountsData[0]?.id
  const account = accountId ? await getAccount(accountId) : null

  return (
    <div className="space-y-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardHeader
          user={user}
          displayName={profile?.username ?? null}
          accounts={accountsData}
          totalBanks={accounts.totalBanks}
          totalCurrentBalance={accounts.totalCurrentBalance}
          dictionary={bd}
          currency={currency}
          lang={lang}
        />

        <DashboardMainContent
          accounts={accountsData}
          transactions={account?.transactions || []}
          accountId={accountId}
          currentPage={currentPage}
          dictionary={bd}
          currency={currency}
        />
      </Suspense>
    </div>
  )
}

/** Centred message for the three terminal states, sized to the content area
 *  rather than `h-screen` (which pushed the message below the fold). */
function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  )
}
