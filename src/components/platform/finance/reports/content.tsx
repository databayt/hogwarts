import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileBarChart, TrendingUp, BarChart, PieChart, Calendar, Download } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ReportsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  let reportsCount = 0
  let generatedReportsCount = 0

  if (schoolId) {
    ;[reportsCount, generatedReportsCount] = await Promise.all([
      db.financialReport.count({ where: { schoolId } }),
      db.financialReport.count({ where: { schoolId, status: 'COMPLETED' } }),
    ])
  }

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.reports

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Financial Reports'}
          description={d?.description || 'Generate comprehensive financial statements and analysis reports'}
          className="text-start max-w-none"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.generated || 'Generated Reports'}</CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generatedReportsCount}</div>
              <p className="text-xs text-muted-foreground">{reportsCount} {d?.stats?.total || 'total'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.types || 'Report Types'}</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.available || 'Available reports'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.scheduled || 'Scheduled'}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.automated || 'Automated reports'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.exports || 'Exports'}</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.formats || 'PDF, Excel, CSV'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {d?.sections?.profitLoss || 'Profit & Loss Statement'}
              </CardTitle>
              <CardDescription>{d?.sections?.profitLossDesc || 'Income statement showing revenue and expenses'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/profit-loss`}>{d?.actions?.generate || 'Generate Report'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/profit-loss/history`}>{d?.actions?.history || 'View History'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                {d?.sections?.balanceSheet || 'Balance Sheet'}
              </CardTitle>
              <CardDescription>{d?.sections?.balanceSheetDesc || 'Assets, liabilities, and equity statement'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/balance-sheet`}>{d?.actions?.generate || 'Generate Report'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/balance-sheet/comparative`}>{d?.actions?.comparative || 'Comparative'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {d?.sections?.cashFlow || 'Cash Flow Statement'}
              </CardTitle>
              <CardDescription>{d?.sections?.cashFlowDesc || 'Operating, investing, and financing cash flows'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/cash-flow`}>{d?.actions?.generate || 'Generate Report'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/cash-flow/projection`}>{d?.actions?.projection || 'Projection'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                {d?.sections?.trialBalance || 'Trial Balance'}
              </CardTitle>
              <CardDescription>{d?.sections?.trialBalanceDesc || 'List of all accounts with debit/credit balances'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/trial-balance`}>{d?.actions?.generate || 'Generate Report'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/trial-balance/adjusted`}>{d?.actions?.adjusted || 'Adjusted'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                {d?.sections?.revenue || 'Revenue Analysis'}
              </CardTitle>
              <CardDescription>{d?.sections?.revenueDesc || 'Detailed breakdown of revenue sources'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/revenue`}>{d?.actions?.generate || 'Generate Report'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/revenue/trends`}>{d?.actions?.trends || 'Trends'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {d?.sections?.expense || 'Expense Analysis'}
              </CardTitle>
              <CardDescription>{d?.sections?.expenseDesc || 'Detailed breakdown of expense categories'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/expense`}>{d?.actions?.generate || 'Generate Report'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/expense/variance`}>{d?.actions?.variance || 'Variance'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {d?.sections?.custom || 'Custom Reports'}
              </CardTitle>
              <CardDescription>{d?.sections?.customDesc || 'Build custom financial reports'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/custom`}>{d?.actions?.create || 'Create Custom'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/custom/templates`}>{d?.actions?.templates || 'Templates'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5" />
                {d?.sections?.all || 'All Reports'}
              </CardTitle>
              <CardDescription>{d?.sections?.allDesc || 'View and manage all generated reports'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/all`}>{d?.actions?.viewAll || 'View All'} ({reportsCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/schedule`}>{d?.actions?.schedule || 'Schedule Reports'}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
