import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { BookOpen, FileText, BarChart, Lock, Calendar, Settings } from 'lucide-react'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { StatsCard, FeatureCard, DashboardGrid } from '../lib/dashboard-components'
import { checkCurrentUserPermission } from '../lib/permissions'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function AccountsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">School context not found</p>
      </div>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, 'accounts', 'view')
  const canCreate = await checkCurrentUserPermission(schoolId, 'accounts', 'create')
  const canEdit = await checkCurrentUserPermission(schoolId, 'accounts', 'edit')
  const canApprove = await checkCurrentUserPermission(schoolId, 'accounts', 'approve')

  // If user can't view accounts, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">You don't have permission to view accounting</p>
      </div>
    )
  }

  let accountsCount = 0
  let journalEntriesCount = 0
  let ledgerEntriesCount = 0
  let fiscalYearsCount = 0
  let postedEntriesCount = 0
  let unpostedEntriesCount = 0

  if (schoolId) {
    try {
      ;[accountsCount, journalEntriesCount, ledgerEntriesCount, fiscalYearsCount, postedEntriesCount, unpostedEntriesCount] = await Promise.all([
        db.chartOfAccount.count({ where: { schoolId } }),
        db.journalEntry.count({ where: { schoolId } }),
        db.ledgerEntry.count({ where: { schoolId } }),
        db.fiscalYear.count({ where: { schoolId } }),
        db.journalEntry.count({ where: { schoolId, isPosted: true } }),
        db.journalEntry.count({ where: { schoolId, isPosted: false } }),
      ])
    } catch (error) {
      console.error('Error fetching account stats:', error)
    }
  }

  const d = dictionary?.finance?.accounts

  return (
    <>
      {/* Stats Grid - Uses semantic HTML (h6, h2, small) */}
        <DashboardGrid type="stats">
          <StatsCard
            title={d?.chartOfAccounts || 'Chart of Accounts'}
            value={accountsCount}
            description="Configured accounts"
            icon={BookOpen}
          />
          <StatsCard
            title={d?.journalEntries || 'Journal Entries'}
            value={journalEntriesCount}
            description={`${postedEntriesCount} ${d?.posted || 'posted'}`}
            icon={FileText}
          />
          <StatsCard
            title="Ledger Entries"
            value={ledgerEntriesCount}
            description="Total transactions"
            icon={BarChart}
          />
          <StatsCard
            title="Unposted"
            value={unpostedEntriesCount}
            description="Requires posting"
            icon={Calendar}
          />
        </DashboardGrid>

        {/* Feature Cards Grid */}
        <DashboardGrid type="features">
          <FeatureCard
            title={d?.chartOfAccounts || 'Chart of Accounts'}
            description="Define and manage account structure"
            icon={BookOpen}
            isPrimary
            primaryAction={{
              label: 'View Chart',
              href: `/${lang}/finance/accounts/chart`,
              count: accountsCount
            }}
            secondaryAction={canCreate ? {
              label: d?.addAccount || 'Add Account',
              href: `/${lang}/finance/accounts/chart/new`
            } : undefined}
          />
          <FeatureCard
            title={d?.journalEntry || 'Journal Entries'}
            description="Record financial transactions"
            icon={FileText}
            primaryAction={{
              label: 'View Journal',
              href: `/${lang}/finance/accounts/journal`,
              count: journalEntriesCount
            }}
            secondaryAction={canCreate ? {
              label: 'New Entry',
              href: `/${lang}/finance/accounts/journal/new`
            } : undefined}
          />
          <FeatureCard
            title="General Ledger"
            description="View account balances and activity"
            icon={BarChart}
            primaryAction={{
              label: 'View Ledger',
              href: `/${lang}/finance/accounts/ledger`
            }}
            secondaryAction={{
              label: 'Account Balances',
              href: `/${lang}/finance/accounts/ledger/balances`
            }}
          />
          {canEdit && (
            <FeatureCard
              title={d?.fiscalYear || 'Fiscal Years'}
              description="Manage accounting periods"
              icon={Calendar}
              primaryAction={{
                label: 'Fiscal Years',
                href: `/${lang}/finance/accounts/fiscal`,
                count: fiscalYearsCount
              }}
              secondaryAction={canCreate ? {
                label: 'New Year',
                href: `/${lang}/finance/accounts/fiscal/new`
              } : undefined}
            />
          )}
          {canApprove && (
            <FeatureCard
              title="Period Closing"
              description="Close accounting periods"
              icon={Lock}
              primaryAction={{
                label: 'Close Period',
                href: `/${lang}/finance/accounts/closing`
              }}
              secondaryAction={{
                label: 'History',
                href: `/${lang}/finance/accounts/closing/history`
              }}
            />
          )}
          {canEdit && (
            <FeatureCard
              title="Accounting Settings"
              description="Configure accounting rules"
              icon={Settings}
              primaryAction={{
                label: 'Settings',
                href: `/${lang}/finance/accounts/settings`
              }}
              secondaryAction={{
                label: 'Posting Rules',
                href: `/${lang}/finance/accounts/settings/rules`
              }}
            />
          )}
        </DashboardGrid>
    </>
  )
}
