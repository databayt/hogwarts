import { Suspense } from 'react'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/components/local/dictionaries'
import type { Locale } from '@/components/local/config'
import { BankingDashboardContent } from '@/components/banking/dashboard/content'
import { getAccounts } from '@/components/banking/actions/bank.actions'
import { getRecentTransactions } from '@/components/banking/actions/transaction.actions'

// Runtime configuration - Node.js required for Prisma
export const runtime = 'nodejs'

// Route segment config
export const dynamic = 'force-dynamic' // Banking data should always be fresh
export const revalidate = 0 // Disable caching for sensitive financial data
export const fetchCache = 'force-no-store'

// Metadata generation
export async function generateMetadata({
  params: { lang },
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.banking?.title || 'Banking Dashboard',
    description: dictionary.banking?.description || 'Manage your bank accounts and transactions',
    robots: 'noindex, nofollow', // Banking pages should not be indexed
  }
}

// Loading component for better streaming
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded" />
        ))}
      </div>
    </div>
  )
}

export default async function BankingDashboardPage({
  searchParams,
  params: { lang },
}: {
  searchParams: { id?: string; page?: string }
  params: { lang: Locale }
}) {
  // Auth check - redirect if not authenticated
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/banking`)
  }

  // Parallel data fetching for better performance
  const [dictionary, accountsData, recentTransactions] = await Promise.all([
    getDictionary(lang),
    getAccounts({ userId: session.user.id }),
    getRecentTransactions({ userId: session.user.id, limit: 10 }),
  ])

  return (
    <div className="layout-container">
      {/* Stream header immediately */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {dictionary.banking?.title || 'Banking Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {dictionary.banking?.description || 'Overview of your financial accounts'}
        </p>
      </div>

      {/* Main content with Suspense for progressive loading */}
      <Suspense fallback={<DashboardSkeleton />}>
        <BankingDashboardContent
          user={session.user}
          accountsData={accountsData}
          recentTransactions={recentTransactions}
          searchParams={searchParams}
          dictionary={dictionary.banking}
          lang={lang}
        />
      </Suspense>
    </div>
  )
}