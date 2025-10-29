import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Users, DollarSign, TrendingUp, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function WalletContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  let walletsCount = 0
  let transactionsCount = 0
  let totalBalance = 0
  let totalTopups = 0

  if (schoolId) {
    try {
      ;[walletsCount, transactionsCount] = await Promise.all([
        db.wallet.count({ where: { schoolId, isActive: true } }),
        db.walletTransaction.count({ where: { schoolId } }),
      ])

      const [balanceAgg, topupsAgg] = await Promise.all([
        db.wallet.aggregate({
          where: { schoolId, isActive: true },
          _sum: { balance: true },
        }),
        db.walletTransaction.aggregate({
          where: { schoolId, type: 'CREDIT' },
          _sum: { amount: true },
        }),
      ])

      totalBalance = balanceAgg._sum?.balance
        ? Number(balanceAgg._sum.balance)
        : 0
      totalTopups = topupsAgg._sum?.amount ? Number(topupsAgg._sum.amount) : 0
    } catch (error) {
      console.error('Error fetching wallet stats:', error)
    }
  }

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.wallet

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Wallet Management'}
          description={d?.description || 'Manage school and parent wallets, track balances and transactions'}
          className="text-start max-w-none"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.totalBalance || 'Total Balance'}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalBalance / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.allWallets || 'Across all wallets'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.activeWallets || 'Active Wallets'}</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletsCount}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.school || 'School'} & {d?.stats?.parent || 'parent wallets'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.transactions || 'Transactions'}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionsCount}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.allTime || 'All time transactions'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.topups || 'Total Top-ups'}</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalTopups / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.lifetime || 'Lifetime top-ups'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                {d?.sections?.wallets || 'All Wallets'}
              </CardTitle>
              <CardDescription>{d?.sections?.walletsDesc || 'View and manage all wallet accounts'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/wallet/all`}>{d?.actions?.viewWallets || 'View Wallets'} ({walletsCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/wallet/new`}>{d?.actions?.createWallet || 'Create Wallet'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5" />
                {d?.sections?.topup || 'Top-up Wallet'}
              </CardTitle>
              <CardDescription>{d?.sections?.topupDesc || 'Add funds to parent or school wallets'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/wallet/topup`}>{d?.actions?.topup || 'Top-up Wallet'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/wallet/topup/bulk`}>{d?.actions?.bulkTopup || 'Bulk Top-up'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {d?.sections?.transactions || 'Transactions'}
              </CardTitle>
              <CardDescription>{d?.sections?.transactionsDesc || 'View all wallet transactions'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/wallet/transactions`}>{d?.actions?.viewTransactions || 'View Transactions'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/wallet/transactions/recent`}>{d?.actions?.recentTransactions || 'Recent'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {d?.sections?.parent || 'Parent Wallets'}
              </CardTitle>
              <CardDescription>{d?.sections?.parentDesc || 'Manage parent/guardian wallets'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/wallet/parent`}>{d?.actions?.parentWallets || 'Parent Wallets'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/wallet/parent/low-balance`}>{d?.actions?.lowBalance || 'Low Balance'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {d?.sections?.school || 'School Wallet'}
              </CardTitle>
              <CardDescription>{d?.sections?.schoolDesc || 'Manage school master wallet'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/wallet/school`}>{d?.actions?.schoolWallet || 'School Wallet'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/wallet/school/transfers`}>{d?.actions?.transfers || 'Transfers'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5" />
                {d?.sections?.reports || 'Wallet Reports'}
              </CardTitle>
              <CardDescription>{d?.sections?.reportsDesc || 'Generate wallet activity reports'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/wallet/reports`}>{d?.actions?.viewReports || 'View Reports'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/wallet/reports/balance`}>{d?.actions?.balanceReport || 'Balance Report'}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
