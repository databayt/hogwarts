import { Suspense } from 'react'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'
import dynamicImport from 'next/dynamic'

// Runtime - Node.js for database operations
export const runtime = 'nodejs'

// Route segment config
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute

// Dynamic imports for code splitting
const TransactionsTable = dynamicImport(
  () => import('@/components/platform/banking/transaction-history/table').then(mod => mod.TransactionsTable),
  {
    loading: () => <TableSkeleton />,
    ssr: true,
  }
)

// const TransactionFilters = dynamicImport(
//   () => import('@/components/platform/banking/transaction-history/filters').then(mod => mod.TransactionFilters),
//   {
//     loading: () => <FilterSkeleton />,
//   }
// )

// Metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; subdomain: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)

  return {
    title: dictionary.banking?.transactionHistory || 'Transaction History',
    description: dictionary.banking?.allTransactions || 'View your transaction history',
  }
}

// Loading skeletons
function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted rounded animate-pulse" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded animate-pulse" />
      ))}
    </div>
  )
}

function FilterSkeleton() {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 w-32 bg-muted rounded animate-pulse" />
      ))}
    </div>
  )
}

// Server component for data fetching
async function TransactionData({
  userId,
  searchParams,
}: {
  userId: string
  searchParams: URLSearchParams
}) {
  const { getTransactionsByUserId } = await import('@/components/platform/banking/actions/transaction.actions')

  // Parse search params
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  // Fetch transactions (filters not yet implemented in the action)
  const transactions = await getTransactionsByUserId({
    userId,
    page,
    limit,
  })

  if (!transactions) {
    throw new Error('Failed to load transactions')
  }

  return transactions
}

export default async function TransactionHistoryPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  params: Promise<{ lang: string; subdomain: string }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams

  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/banking/transaction-history`)
  }

  const dictionary = await getDictionary(lang as Locale)
  const urlSearchParams = new URLSearchParams(resolvedSearchParams as Record<string, string>)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {dictionary.banking?.transactionHistory || 'Transaction History'}
        </h1>
        <p className="text-muted-foreground">
          {dictionary.banking?.allTransactions || 'View and manage your transactions'}
        </p>
      </div>

      {/* Filters - Client component for interactivity */}
      {/* <Suspense fallback={<FilterSkeleton />}>
        <TransactionFilters
          dictionary={dictionary.banking?.transactions}
          defaultValues={Object.fromEntries(urlSearchParams)}
        />
      </Suspense> */}

      {/* Transaction table with streaming */}
      <Suspense
        key={urlSearchParams.toString()} // Re-suspend on params change
        fallback={<TableSkeleton />}
      >
        <TransactionDataWrapper
          userId={session.user.id}
          searchParams={urlSearchParams}
          dictionary={dictionary.banking}
        />
      </Suspense>
    </div>
  )
}

// Wrapper component for error boundary
async function TransactionDataWrapper({
  userId,
  searchParams,
  dictionary,
}: {
  userId: string
  searchParams: URLSearchParams
  dictionary: any
}) {
  try {
    const result = await TransactionData({ userId, searchParams })
    const { getAccounts } = await import('@/components/platform/banking/actions/bank.actions')

    // Get accounts for the user
    const accounts = await getAccounts({ userId })

    if (!accounts?.data || accounts.data.length === 0) {
      return (
        <div className="border rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">
            {dictionary?.noTransactionHistory || 'No transaction history'}
          </h3>
          <p className="text-muted-foreground">
            {dictionary?.connectBankForHistory || 'Connect a bank account to see your transaction history'}
          </p>
        </div>
      )
    }

    return (
      <TransactionsTable
        transactions={result.data}
        accounts={accounts.data}
        currentPage={result.page}
        dictionary={dictionary}
      />
    )
  } catch (error) {
    console.error('Error loading transactions:', error)
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">
          {dictionary?.error || 'Failed to load transactions'}
        </p>
      </div>
    )
  }
}