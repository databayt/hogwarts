import { getAccounts } from "@/components/platform/finance/banking/actions/bank.actions"

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
  const accountsResult = await getAccounts({ userId: user.id })

  if (
    !accountsResult.success ||
    !accountsResult.data?.data ||
    accountsResult.data.data.length === 0
  ) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <h3 className="mb-2 text-lg font-semibold">
          {dictionary?.noTransactionHistory || "No transaction history"}
        </h3>
        <p className="text-muted-foreground">
          {dictionary?.connectBankForHistory ||
            "Connect a bank account to see your transaction history"}
        </p>
      </div>
    )
  }

  const accounts = accountsResult.data.data

  // Get all transactions from all accounts
  const allTransactions = accounts
    .flatMap((account: any) => account.transactions || [])
    .sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

  return (
    <div className="space-y-6">
      <TransactionsTable
        transactions={allTransactions}
        accounts={accounts}
        currentPage={page}
        dictionary={dictionary}
      />
    </div>
  )
}
