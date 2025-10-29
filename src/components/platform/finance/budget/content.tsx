import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, TrendingUp, AlertTriangle, CheckCircle, DollarSign, BarChart } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function BudgetContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  let budgetsCount = 0
  let allocationsCount = 0
  let totalBudget = 0
  let totalSpent = 0

  if (schoolId) {
    ;[budgetsCount, allocationsCount] = await Promise.all([
      db.budget.count({ where: { schoolId, status: 'ACTIVE' } }),
      db.budgetAllocation.count({ where: { schoolId } }),
    ])

    const [budgetAgg, spentAgg] = await Promise.all([
      db.budget.aggregate({
        where: { schoolId, status: 'ACTIVE' },
        _sum: { totalAmount: true },
      }),
      db.budgetAllocation.aggregate({
        where: { schoolId },
        _sum: { spent: true },
      }),
    ])

    totalBudget = budgetAgg._sum?.totalAmount
      ? Number(budgetAgg._sum.totalAmount)
      : 0
    totalSpent = spentAgg._sum?.spent ? Number(spentAgg._sum.spent) : 0
  }

  const variance = totalBudget - totalSpent
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.budget

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Budget Planning'}
          description={d?.description || 'Create budgets, allocate funds, and track spending variance'}
          className="text-start max-w-none"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.totalBudget || 'Total Budget'}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalBudget / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.allocated || 'Allocated budget'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.spent || 'Spent'}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalSpent / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{utilizationRate.toFixed(1)}% {d?.stats?.utilization || 'utilization'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.remaining || 'Remaining'}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(variance / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.available || 'Available budget'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.allocations || 'Allocations'}</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allocationsCount}</div>
              <p className="text-xs text-muted-foreground">{budgetsCount} {d?.stats?.active || 'active budgets'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                {d?.sections?.budgets || 'Budgets'}
              </CardTitle>
              <CardDescription>{d?.sections?.budgetsDesc || 'Create and manage school budgets'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/budget/all`}>{d?.actions?.viewBudgets || 'View Budgets'} ({budgetsCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/budget/new`}>{d?.actions?.createBudget || 'Create Budget'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {d?.sections?.allocations || 'Budget Allocations'}
              </CardTitle>
              <CardDescription>{d?.sections?.allocationsDesc || 'Allocate budget by department or category'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/budget/allocations`}>{d?.actions?.viewAllocations || 'View Allocations'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/budget/allocations/new`}>{d?.actions?.allocate || 'Allocate Funds'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {d?.sections?.tracking || 'Spending Tracking'}
              </CardTitle>
              <CardDescription>{d?.sections?.trackingDesc || 'Monitor budget utilization and spending'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/budget/tracking`}>{d?.actions?.trackSpending || 'Track Spending'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/budget/tracking/realtime`}>{d?.actions?.realtime || 'Real-time View'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {d?.sections?.variance || 'Variance Analysis'}
              </CardTitle>
              <CardDescription>{d?.sections?.varianceDesc || 'Analyze budget vs actual spending'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/budget/variance`}>{d?.actions?.variance || 'Variance Report'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/budget/variance/alerts`}>{d?.actions?.alerts || 'Budget Alerts'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                {d?.sections?.reports || 'Budget Reports'}
              </CardTitle>
              <CardDescription>{d?.sections?.reportsDesc || 'Generate budget analysis reports'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/budget/reports`}>{d?.actions?.viewReports || 'View Reports'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/budget/reports/summary`}>{d?.actions?.summary || 'Budget Summary'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {d?.sections?.approval || 'Budget Approval'}
              </CardTitle>
              <CardDescription>{d?.sections?.approvalDesc || 'Review and approve budget requests'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/budget/approval`}>{d?.actions?.pending || 'Pending Approval'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/budget/approval/history`}>{d?.actions?.history || 'Approval History'}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
