import { getAccounts } from '@/components/platform/finance/banking/actions/bank.actions'
import { TransactionsTable } from './table'
import PageHeader from '@/components/atom/page-header'

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
  lang
}: TransactionHistoryContentProps) {
  const page = Number(searchParams?.page) || 1
  const accountsResult = await getAccounts({ userId: user.id })

  if (!accountsResult.success || !accountsResult.data?.data || accountsResult.data.data.length === 0) {
    return (
      <div className="p-8">
        <div className="border rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">
            {dictionary?.noTransactionHistory || 'No transaction history'}
          </h3>
          <p className="text-muted-foreground">
            {dictionary?.connectBankForHistory || 'Connect a bank account to see your transaction history'}
          </p>
        </div>
      </div>
    )
  }

  const accounts = accountsResult.data.data

  // Get all transactions from all accounts
  const allTransactions = accounts.flatMap((account: any) =>
    account.transactions || []
  ).sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <PageHeader
          title={dictionary?.transactionHistory || 'Transaction History'}
          description={dictionary?.transactionHistoryDescription || 'View and search all your transactions'}
          className="text-start max-w-none"
        />
      </div>

      <TransactionsTable
        transactions={allTransactions}
        accounts={accounts}
        currentPage={page}
        dictionary={dictionary}
      />
    </div>
  )
}