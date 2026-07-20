// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { AccountTabs } from "./account-tabs"
import { RecentTransactionsList } from "./recent-transactions"

interface DashboardMainContentProps {
  accounts: any[]
  transactions: any[]
  accountId: string
  currentPage: number
  dictionary: any
  currency: string
}

export function DashboardMainContent({
  accounts,
  transactions,
  accountId,
  currentPage,
  dictionary,
  currency,
}: DashboardMainContentProps) {
  return (
    <div className="space-y-6">
      <AccountTabs
        accounts={accounts}
        currentAccountId={accountId}
        dictionary={dictionary}
        currency={currency}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {dictionary?.recentTransactions || "Recent Transactions"}
        </h2>
        <RecentTransactionsList
          transactions={transactions}
          currentPage={currentPage}
          dictionary={dictionary}
          currency={currency}
        />
      </section>
    </div>
  )
}
