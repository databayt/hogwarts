import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, FileText, BarChart, Lock, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function AccountsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

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

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.accounts

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Accounting System'}
          description={d?.description || 'Double-entry bookkeeping, chart of accounts, journal entries, and general ledger'}
          className="text-start max-w-none"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.accounts || 'Chart of Accounts'}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accountsCount}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.configured || 'Configured accounts'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.journal || 'Journal Entries'}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{journalEntriesCount}</div>
              <p className="text-xs text-muted-foreground">{postedEntriesCount} {d?.stats?.posted || 'posted'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.ledger || 'Ledger Entries'}</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ledgerEntriesCount}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.transactions || 'Total transactions'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.unposted || 'Unposted'}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unpostedEntriesCount}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.requiresPosting || 'Requires posting'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {d?.sections?.chart || 'Chart of Accounts'}
              </CardTitle>
              <CardDescription>{d?.sections?.chartDesc || 'Define and manage account structure'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/accounts/chart`}>{d?.actions?.viewChart || 'View Chart'} ({accountsCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/accounts/chart/new`}>{d?.actions?.addAccount || 'Add Account'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {d?.sections?.journal || 'Journal Entries'}
              </CardTitle>
              <CardDescription>{d?.sections?.journalDesc || 'Record financial transactions'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/accounts/journal`}>{d?.actions?.viewJournal || 'View Journal'} ({journalEntriesCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/accounts/journal/new`}>{d?.actions?.newEntry || 'New Entry'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                {d?.sections?.ledger || 'General Ledger'}
              </CardTitle>
              <CardDescription>{d?.sections?.ledgerDesc || 'View account balances and activity'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/accounts/ledger`}>{d?.actions?.viewLedger || 'View Ledger'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/accounts/ledger/balances`}>{d?.actions?.balances || 'Account Balances'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {d?.sections?.fiscal || 'Fiscal Years'}
              </CardTitle>
              <CardDescription>{d?.sections?.fiscalDesc || 'Manage accounting periods'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/accounts/fiscal`}>{d?.actions?.fiscalYears || 'Fiscal Years'} ({fiscalYearsCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/accounts/fiscal/new`}>{d?.actions?.newYear || 'New Year'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {d?.sections?.closing || 'Period Closing'}
              </CardTitle>
              <CardDescription>{d?.sections?.closingDesc || 'Close accounting periods'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/accounts/closing`}>{d?.actions?.closePeriod || 'Close Period'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/accounts/closing/history`}>{d?.actions?.closingHistory || 'History'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {d?.sections?.settings || 'Accounting Settings'}
              </CardTitle>
              <CardDescription>{d?.sections?.settingsDesc || 'Configure accounting rules'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/accounts/settings`}>{d?.actions?.settings || 'Settings'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/accounts/settings/rules`}>{d?.actions?.rules || 'Posting Rules'}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
