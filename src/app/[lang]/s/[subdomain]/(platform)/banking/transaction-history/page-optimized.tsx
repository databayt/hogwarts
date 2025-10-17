import { Suspense } from 'react'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { getDictionary } from '@/components/local/dictionaries'
import type { Locale } from '@/components/local/config'
import dynamic from 'next/dynamic'

// Runtime - Node.js for database operations
export const runtime = 'nodejs'

// Route segment config
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute

// Dynamic imports for code splitting
const TransactionTable = dynamic(
  () => import('@/components/banking/transaction-history/table').then(mod => mod.TransactionTable),
  {
    loading: () => <TableSkeleton />,
    ssr: true,
  }
)

const TransactionFilters = dynamic(
  () => import('@/components/banking/transaction-history/filters').then(mod => mod.TransactionFilters),
  {
    loading: () => <FilterSkeleton />,
  }
)

// Metadata generation
export async function generateMetadata({
  params: { lang },
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.banking?.transactions?.title || 'Transaction History',
    description: dictionary.banking?.transactions?.description || 'View your transaction history',
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
  const { getTransactions } = await import('@/components/banking/actions/transaction.actions')

  // Parse search params
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20
  const accountId = searchParams.get('account') || undefined
  const category = searchParams.get('category') || undefined
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  // Fetch transactions with filters
  const transactions = await getTransactions({
    userId,
    page,
    limit,
    accountId,
    category,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  })

  if (!transactions) {
    throw new Error('Failed to load transactions')
  }

  return transactions
}

export default async function TransactionHistoryPage({
  searchParams,
  params: { lang },
}: {
  searchParams: { [key: string]: string | string[] | undefined }
  params: { lang: Locale }
}) {
  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/banking/transaction-history`)
  }

  const dictionary = await getDictionary(lang)
  const urlSearchParams = new URLSearchParams(searchParams as Record<string, string>)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {dictionary.banking?.transactions?.title || 'Transaction History'}
        </h1>
        <p className="text-muted-foreground">
          {dictionary.banking?.transactions?.description || 'View and manage your transactions'}
        </p>
      </div>

      {/* Filters - Client component for interactivity */}
      <Suspense fallback={<FilterSkeleton />}>
        <TransactionFilters
          dictionary={dictionary.banking?.transactions}
          defaultValues={Object.fromEntries(urlSearchParams)}
        />
      </Suspense>

      {/* Transaction table with streaming */}
      <Suspense
        key={urlSearchParams.toString()} // Re-suspend on params change
        fallback={<TableSkeleton />}
      >
        <TransactionDataWrapper
          userId={session.user.id}
          searchParams={urlSearchParams}
          dictionary={dictionary.banking?.transactions}
          lang={lang}
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
  lang,
}: {
  userId: string
  searchParams: URLSearchParams
  dictionary: any
  lang: Locale
}) {
  try {
    const transactions = await TransactionData({ userId, searchParams })

    return (
      <TransactionTable
        transactions={transactions}
        dictionary={dictionary}
        lang={lang}
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