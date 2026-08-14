// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getAccounts } from "@/components/school-dashboard/finance/banking/actions/bank.actions"

import { getTransactionHistory, TRANSACTION_WINDOW } from "./queries"
import { TransactionsTableImproved as TransactionsTable } from "./table"

interface TransactionHistoryContentProps {
  user: any
  searchParams: { page?: string; accountId?: string }
  dictionary: any
  lang: string
}

export async function TransactionHistoryContent({
  user,
  searchParams,
  dictionary,
  lang,
}: TransactionHistoryContentProps) {
  const page = Number(searchParams?.page) || 1
  const fullDict = await getDictionary(lang as Locale)
  const fd = (fullDict as any)?.finance
  const bt = fd?.bankingTransactions as Record<string, string> | undefined
  const [accountsResult, history] = await Promise.all([
    getAccounts({ userId: user.id }),
    getTransactionHistory(),
  ])

  if (
    !accountsResult.success ||
    !accountsResult.data?.data ||
    accountsResult.data.data.length === 0
  ) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <h3 className="mb-2 text-lg font-semibold">
          {bt?.noTransactionHistory || "No transaction history"}
        </h3>
        <p className="text-muted-foreground">
          {bt?.connectBankForHistory ||
            "Connect a bank account to see your transaction history"}
        </p>
      </div>
    )
  }

  const accounts = accountsResult.data.data

  // History comes from its own query. It used to be stitched together from
  // `getAccounts`, whose include is `transactions: { take: 5 }` — so this page
  // silently showed at most five rows per account while advertising a pager.
  return (
    <div className="space-y-6">
      <TransactionsTable
        transactions={history.transactions}
        accounts={accounts}
        currentPage={page}
        totalTransactions={history.total}
        windowSize={TRANSACTION_WINDOW}
        dictionary={bt}
      />
    </div>
  )
}
