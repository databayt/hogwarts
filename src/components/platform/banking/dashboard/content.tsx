import { Suspense } from 'react'
import { getAccounts, getAccount } from '@/components/platform/banking/actions/bank.actions'
import { DashboardHeader } from './header'
import { DashboardMainContent } from './main-content'
import { DashboardSidebar } from './sidebar'
import { DashboardSkeleton } from './skeleton'

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
  const currentPage = Number(searchParams?.page) || 1

  const accountsResult = await getAccounts({
    userId: user.id
  })

  // Handle error or no accounts
  if (!accountsResult.success || !accountsResult.data?.data || accountsResult.data.data.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {dictionary?.noAccounts || 'No accounts found. Please connect a bank account.'}
        </p>
      </div>
    )
  }

  const accounts = accountsResult.data
  const accountsData = accounts.data
  const accountId = searchParams?.id || accountsData[0]?.id
  const accountResult = await getAccount({ accountId })
  const account = accountResult.success ? accountResult.data : null

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardHeader
              user={user}
              accounts={accountsData}
              totalBanks={accounts.totalBanks}
              totalCurrentBalance={accounts.totalCurrentBalance}
              dictionary={dictionary}
            />

            <DashboardMainContent
              accounts={accountsData}
              transactions={account?.transactions}
              accountId={accountId}
              currentPage={currentPage}
              dictionary={dictionary}
            />
          </Suspense>
        </div>
      </div>

      <DashboardSidebar
        user={user}
        transactions={account?.transactions}
        banks={accountsData?.slice(0, 2)}
        dictionary={dictionary}
        lang={lang}
      />
    </div>
  )
}