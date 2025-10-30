import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Wallet, Users, DollarSign, TrendingUp, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { StatsCard, FeatureCard, DashboardGrid, formatCurrency } from '../lib/dashboard-components'
import { checkCurrentUserPermission } from '../lib/permissions'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function WalletContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-6">
          <PageHeader
            title="Wallet Management"
            description="School context not found"
            className="text-start max-w-none"
          />
        </div>
      </PageContainer>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, 'wallet', 'view')
  const canCreate = await checkCurrentUserPermission(schoolId, 'wallet', 'create')
  const canEdit = await checkCurrentUserPermission(schoolId, 'wallet', 'edit')
  const canProcess = await checkCurrentUserPermission(schoolId, 'wallet', 'process')
  const canExport = await checkCurrentUserPermission(schoolId, 'wallet', 'export')

  // If user can't view wallet, show empty state
  if (!canView) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-6">
          <PageHeader
            title="Wallet Management"
            description="You don't have permission to view wallet"
            className="text-start max-w-none"
          />
        </div>
      </PageContainer>
    )
  }

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

      totalBalance = balanceAgg._sum?.balance ? Number(balanceAgg._sum.balance) : 0
      totalTopups = topupsAgg._sum?.amount ? Number(topupsAgg._sum.amount) : 0
    } catch (error) {
      console.error('Error fetching wallet stats:', error)
    }
  }

  const d = dictionary?.finance?.wallet as any

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Wallet Management'}
          description={d?.description || 'Manage school and parent wallets, track balances and transactions'}
          className="text-start max-w-none"
        />

        <DashboardGrid type="stats">
          <StatsCard
            title={d?.stats?.totalBalance || 'Total Balance'}
            value={formatCurrency(totalBalance)}
            description={d?.stats?.allWallets || 'Across all wallets'}
            icon={DollarSign}
          />
          <StatsCard
            title={d?.stats?.activeWallets || 'Active Wallets'}
            value={walletsCount}
            description={`${d?.stats?.school || 'School'} & ${d?.stats?.parent || 'parent wallets'}`}
            icon={Wallet}
          />
          <StatsCard
            title={d?.stats?.transactions || 'Transactions'}
            value={transactionsCount}
            description={d?.stats?.allTime || 'All time transactions'}
            icon={TrendingUp}
          />
          <StatsCard
            title={d?.stats?.topups || 'Total Top-ups'}
            value={formatCurrency(totalTopups)}
            description={d?.stats?.lifetime || 'Lifetime top-ups'}
            icon={ArrowUpCircle}
          />
        </DashboardGrid>

        <DashboardGrid type="features">
          <FeatureCard
            title={d?.sections?.wallets || 'All Wallets'}
            description={d?.sections?.walletsDesc || 'View and manage all wallet accounts'}
            icon={Wallet}
            isPrimary
            primaryAction={{
              label: d?.actions?.viewWallets || 'View Wallets',
              href: `/${lang}/finance/wallet/all`,
              count: walletsCount
            }}
            secondaryAction={canCreate ? {
              label: d?.actions?.createWallet || 'Create Wallet',
              href: `/${lang}/finance/wallet/new`
            } : undefined}
          />
          {canProcess && (
            <FeatureCard
              title={d?.sections?.topup || 'Top-up Wallet'}
              description={d?.sections?.topupDesc || 'Add funds to parent or school wallets'}
              icon={ArrowUpCircle}
              primaryAction={{
                label: d?.actions?.topup || 'Top-up',
                href: `/${lang}/finance/wallet/topup`
              }}
              secondaryAction={{
                label: d?.actions?.bulkTopup || 'Bulk Top-up',
                href: `/${lang}/finance/wallet/topup/bulk`
              }}
            />
          )}
          <FeatureCard
            title={d?.sections?.transactions || 'Transactions'}
            description={d?.sections?.transactionsDesc || 'View wallet transaction history'}
            icon={TrendingUp}
            primaryAction={{
              label: d?.actions?.viewTransactions || 'View Transactions',
              href: `/${lang}/finance/wallet/transactions`
            }}
            secondaryAction={canExport ? {
              label: d?.actions?.export || 'Export',
              href: `/${lang}/finance/wallet/transactions/export`
            } : undefined}
          />
          {canProcess && (
            <FeatureCard
              title={d?.sections?.refunds || 'Refunds'}
              description={d?.sections?.refundsDesc || 'Process wallet refunds and adjustments'}
              icon={ArrowDownCircle}
              primaryAction={{
                label: d?.actions?.processRefund || 'Process Refund',
                href: `/${lang}/finance/wallet/refund`
              }}
              secondaryAction={{
                label: d?.actions?.refundHistory || 'Refund History',
                href: `/${lang}/finance/wallet/refund/history`
              }}
            />
          )}
          <FeatureCard
            title={d?.sections?.parentWallets || 'Parent Wallets'}
            description={d?.sections?.parentWalletsDesc || 'Manage parent wallet accounts'}
            icon={Users}
            primaryAction={{
              label: d?.actions?.viewParents || 'View Parent Wallets',
              href: `/${lang}/finance/wallet/parents`
            }}
            secondaryAction={{
              label: d?.actions?.statements || 'Statements',
              href: `/${lang}/finance/wallet/parents/statements`
            }}
          />
          {canExport && (
            <FeatureCard
              title={d?.sections?.reports || 'Wallet Reports'}
              description={d?.sections?.reportsDesc || 'Generate wallet balance and transaction reports'}
              icon={DollarSign}
              primaryAction={{
                label: d?.actions?.reports || 'View Reports',
                href: `/${lang}/finance/wallet/reports`
              }}
              secondaryAction={{
                label: d?.actions?.balanceSheet || 'Balance Sheet',
                href: `/${lang}/finance/wallet/reports/balance`
              }}
            />
          )}
        </DashboardGrid>
      </div>
    </PageContainer>
  )
}
