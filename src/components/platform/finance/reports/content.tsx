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
import { checkCurrentUserPermission } from '../lib/permissions'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ReportsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, 'reports', 'view')
  const canExport = await checkCurrentUserPermission(schoolId, 'reports', 'export')

  // If user can't view reports, show empty state
  if (!canView) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-6">
          <PageHeader
            title="Financial Reports"
            description="You don't have permission to view reports"
            className="text-start max-w-none"
          />
        </div>
      </PageContainer>
    )
  }

  let reportsCount = 0
  let generatedReportsCount = 0

  if (schoolId) {
    try {
      ;[reportsCount, generatedReportsCount] = await Promise.all([
        db.financialReport.count({ where: { schoolId } }),
        db.financialReport.count({ where: { schoolId, status: 'COMPLETED' } }),
      ])
    } catch (error) {
      console.error('Error fetching report stats:', error)
    }
  }

  const d = dictionary?.finance?.reports

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Financial Reports'}
          description="Generate comprehensive financial statements and analysis reports"
          className="text-start max-w-none"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Generated Reports</CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generatedReportsCount}</div>
              <p className="text-xs text-muted-foreground">{reportsCount} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Report Types</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Available reports</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Automated reports</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exports</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">PDF, Excel, CSV</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Profit & Loss Statement
              </CardTitle>
              <CardDescription>Income statement showing revenue and expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/profit-loss`}>Generate Report</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/profit-loss/history`}>View History</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Balance Sheet
              </CardTitle>
              <CardDescription>Assets, liabilities, and equity statement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/balance-sheet`}>Generate Report</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/balance-sheet/comparative`}>Comparative</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cash Flow Statement
              </CardTitle>
              <CardDescription>Operating, investing, and financing cash flows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/cash-flow`}>Generate Report</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/cash-flow/projection`}>Projection</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Trial Balance
              </CardTitle>
              <CardDescription>List of all accounts with debit/credit balances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/trial-balance`}>Generate Report</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/trial-balance/adjusted`}>Adjusted</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Revenue Analysis
              </CardTitle>
              <CardDescription>Detailed breakdown of revenue sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/revenue`}>Generate Report</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/revenue/trends`}>Trends</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Expense Analysis
              </CardTitle>
              <CardDescription>Detailed breakdown of expense categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/expense`}>Generate Report</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/expense/variance`}>Variance</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Custom Reports
              </CardTitle>
              <CardDescription>Build custom financial reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/custom`}>Create Custom</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/custom/templates`}>Templates</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5" />
                All Reports
              </CardTitle>
              <CardDescription>View and manage all generated reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/reports/all`}>View All ({reportsCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/reports/schedule`}>Schedule Reports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
