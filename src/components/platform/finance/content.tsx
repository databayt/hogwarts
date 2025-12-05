import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FileText, Receipt, Building2, CreditCard, DollarSign, Users, Clock, Wallet, TrendingUp, BookOpen, CircleAlert } from "lucide-react"
import Image from 'next/image'
import { PieChart, FileBarChart } from "lucide-react"
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { InteractiveBarChart } from '@/components/platform/dashboard/charts/interactive-bar-chart'
import { RadialTextChart } from '@/components/platform/dashboard/charts/radial-text-chart'
import { AreaChartStacked } from '@/components/platform/dashboard/charts/area-chart-stacked'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function FinanceContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Get comprehensive financial stats from all sub-blocks
  let invoicesCount = 0
  let receiptsCount = 0
  let bankAccountsCount = 0
  let studentsWithFeesCount = 0
  let teachersWithSalaryCount = 0
  let pendingPayrollCount = 0
  let pendingTimesheetsCount = 0
  let walletsCount = 0
  let activeBudgetsCount = 0
  let pendingExpensesCount = 0
  let accountsCount = 0
  let reportsCount = 0

  let totalRevenue = 0
  let totalExpenses = 0
  let pendingPayments = 0
  let unpaidInvoices = 0

  if (schoolId) {
    try {
      ;[
        invoicesCount,
        receiptsCount,
        bankAccountsCount,
        studentsWithFeesCount,
        teachersWithSalaryCount,
        pendingPayrollCount,
        pendingTimesheetsCount,
        walletsCount,
        activeBudgetsCount,
        pendingExpensesCount,
        accountsCount,
        reportsCount,
      ] = await Promise.all([
        db.userInvoice.count({ where: { schoolId } }).catch(() => 0),
        db.expenseReceipt.count({ where: { schoolId } }).catch(() => 0),
        db.bankAccount.count({ where: { schoolId } }).catch(() => 0),
        db.feeAssignment.count({ where: { schoolId } }).catch(() => 0),
        db.salaryStructure.count({ where: { schoolId } }).catch(() => 0),
        db.payrollRun.count({
          where: { schoolId, status: { in: ['DRAFT', 'PENDING_APPROVAL'] } },
        }).catch(() => 0),
        db.timesheetEntry.count({
          where: { schoolId, status: 'SUBMITTED' },
        }).catch(() => 0),
        db.wallet.count({ where: { schoolId } }).catch(() => 0),
        db.budget.count({
          where: { schoolId, status: 'ACTIVE' },
        }).catch(() => 0),
        db.expense.count({
          where: { schoolId, status: 'PENDING' },
        }).catch(() => 0),
        db.chartOfAccount.count({ where: { schoolId } }).catch(() => 0),
        db.financialReport.count({ where: { schoolId } }).catch(() => 0),
      ])

      // Calculate financial totals
      const [revenueAgg, expensesAgg, pendingPaymentsAgg, unpaidInvoicesAgg] =
        await Promise.all([
          db.payment.aggregate({
            where: { schoolId, status: 'SUCCESS' },
            _sum: { amount: true },
          }).catch(() => ({ _sum: { amount: null } })),
          db.expense.aggregate({
            where: { schoolId, status: 'APPROVED' },
            _sum: { amount: true },
          }).catch(() => ({ _sum: { amount: null } })),
          db.payment.aggregate({
            where: { schoolId, status: 'PENDING' },
            _sum: { amount: true },
          }).catch(() => ({ _sum: { amount: null } })),
          db.userInvoice.count({
            where: { schoolId, status: { in: ['UNPAID', 'OVERDUE'] } },
          }).catch(() => 0),
        ])

      totalRevenue = revenueAgg._sum.amount?.toNumber() || 0
      totalExpenses = expensesAgg._sum.amount?.toNumber() || 0
      pendingPayments = pendingPaymentsAgg._sum.amount?.toNumber() || 0
      unpaidInvoices = unpaidInvoicesAgg
    } catch (error) {
      console.error('Error fetching finance data:', error)
      // Continue with zero values if database queries fail
    }
  }

  const d = dictionary?.finance

  // Secondary pages for quick access section (hidden from main nav)
  const secondaryPages = [
    { name: d?.navigation?.receipt || 'Receipt', href: `/${lang}/finance/receipt` },
    { name: d?.navigation?.timesheet || 'Timesheet', href: `/${lang}/finance/timesheet` },
    { name: d?.navigation?.wallet || 'Wallet', href: `/${lang}/finance/wallet` },
    { name: d?.navigation?.budget || 'Budget', href: `/${lang}/finance/budget` },
    { name: d?.navigation?.expenses || 'Expenses', href: `/${lang}/finance/expenses` },
    { name: d?.navigation?.accounts || 'Accounts', href: `/${lang}/finance/accounts` },
  ]

  return (
    <div className="space-y-6">
      {/* Overview Stats - Financial Health */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bank Card with Image */}
        <div className="flex items-center justify-center">
          <Image
            src="/master-card.png"
            alt="Bank Card"
            width={1050}
            height={600}
            className="w-full h-auto max-w-md"
            priority
          />
        </div>

        {/* 2x2 Grid - Other Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.stats?.totalRevenue || 'Total Revenue'}
              </CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                ${Math.floor(totalRevenue / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.fromCompletedPayments || 'Completed'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.stats?.totalExpenses || 'Total Expenses'}
              </CardTitle>
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                ${Math.floor(totalExpenses / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.approvedExpenses || 'Approved'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.stats?.pendingPayments || 'Pending'}
              </CardTitle>
              <CircleAlert className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                ${Math.floor(pendingPayments / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.awaitingProcessing || 'Awaiting'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.stats?.unpaidInvoices || 'Unpaid'}
              </CardTitle>
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{unpaidInvoices}</div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.invoicesOutstanding || 'Invoices'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <InteractiveBarChart />
        <div className="grid gap-4 md:grid-cols-2">
          <RadialTextChart />
          <AreaChartStacked />
        </div>
      </div>

      {/* More Features - Secondary Navigation Links */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {d?.moreFeatures || 'More Features'}
            </CardTitle>
            <CardDescription>
              {d?.moreFeaturesDescription || 'Additional finance management tools and utilities'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {secondaryPages.map((page) => {
                const getDescription = (pageName: string) => {
                  if (pageName === (d?.navigation?.receipt || 'Receipt')) return d?.quickAccess?.receipt || 'Expense receipts & scanning'
                  if (pageName === (d?.navigation?.timesheet || 'Timesheet')) return d?.quickAccess?.timesheet || 'Staff time tracking'
                  if (pageName === (d?.navigation?.wallet || 'Wallet')) return d?.quickAccess?.wallet || 'School & parent wallets'
                  if (pageName === (d?.navigation?.budget || 'Budget')) return d?.quickAccess?.budget || 'Budget planning & variance'
                  if (pageName === (d?.navigation?.expenses || 'Expenses')) return d?.quickAccess?.expenses || 'Expense approval workflow'
                  if (pageName === (d?.navigation?.accounts || 'Accounts')) return d?.quickAccess?.accounts || 'Chart of accounts & ledger'
                  return ''
                }

                return (
                  <Button
                    key={page.href}
                    asChild
                    variant="outline"
                    className="justify-start h-auto py-3"
                  >
                    <Link href={page.href}>
                      {page.name === (d?.navigation?.receipt || 'Receipt') && <Receipt className="mr-2 h-4 w-4" />}
                      {page.name === (d?.navigation?.timesheet || 'Timesheet') && <Clock className="mr-2 h-4 w-4" />}
                      {page.name === (d?.navigation?.wallet || 'Wallet') && <Wallet className="mr-2 h-4 w-4" />}
                      {page.name === (d?.navigation?.budget || 'Budget') && <PieChart className="mr-2 h-4 w-4" />}
                      {page.name === (d?.navigation?.expenses || 'Expenses') && <TrendingUp className="mr-2 h-4 w-4" />}
                      {page.name === (d?.navigation?.accounts || 'Accounts') && <BookOpen className="mr-2 h-4 w-4" />}
                      <span className="flex flex-col items-start">
                        <span className="font-medium">{page.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {getDescription(page.name)}
                        </span>
                      </span>
                    </Link>
                  </Button>
                )
              })}
            </div>
          </CardContent>
      </Card>

      {/* Finance Sub-Blocks Navigation */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Invoice Block */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {d?.cards?.invoicing?.title || 'Invoicing'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.invoicing?.description || 'Client invoicing and billing management'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.invoicing?.details || 'Create professional invoices, track payments, and manage client billing.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href={`/${lang}/finance/invoice`}>
                    <FileText className="mr-2 h-4 w-4" />
                    {d?.cards?.invoicing?.viewAll || 'View All Invoices'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/invoice/new`}>
                    {d?.cards?.invoicing?.create || 'Create Invoice'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Block */}
          <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-500" />
                {d?.cards?.receipts?.title || 'Receipts'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.receipts?.description || 'Receipt generation and expense tracking'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.receipts?.details || 'Generate receipts, scan expenses with AI OCR, and track all transactions.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/receipt`}>
                    <Receipt className="mr-2 h-4 w-4" />
                    {d?.cards?.receipts?.viewAll || 'View All Receipts'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/receipt/upload`}>
                    {d?.cards?.receipts?.upload || 'Upload Receipt'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Banking Block */}
          <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-500" />
                {d?.cards?.banking?.title || 'Banking'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.banking?.description || 'Bank accounts and transaction management'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.banking?.details || 'Connect bank accounts, track transactions, manage transfers, and reconcile.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/banking`}>
                    <Building2 className="mr-2 h-4 w-4" />
                    {d?.cards?.banking?.viewAccounts || 'View Accounts'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/banking/connect`}>
                    {d?.cards?.banking?.connect || 'Connect Bank'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fees Block */}
          <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-500" />
                {d?.cards?.fees?.title || 'Student Fees'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.fees?.description || 'Fee structures and student payment tracking'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.fees?.details || 'Manage fee structures, track student payments, handle scholarships and fines.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/fees`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {d?.cards?.fees?.viewStructures || 'View Fee Structures'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/fees/payments`}>
                    {d?.cards?.fees?.trackPayments || 'Track Payments'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Salary Block */}
          <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                {d?.cards?.salary?.title || 'Salary Management'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.salary?.description || 'Staff salary structures and calculations'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.salary?.details || 'Define salary structures, manage allowances and deductions, calculate pay.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/salary`}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    {d?.cards?.salary?.viewStructures || 'View Structures'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/salary/calculator`}>
                    {d?.cards?.salary?.calculator || 'Salary Calculator'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Block */}
          <Card className="border-red-500/20 hover:border-red-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-500" />
                {d?.cards?.payroll?.title || 'Payroll Processing'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.payroll?.description || 'Payroll runs and salary slip generation'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.payroll?.details || 'Process payroll, generate salary slips, calculate taxes, and handle disbursements.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/payroll`}>
                    <Users className="mr-2 h-4 w-4" />
                    {d?.cards?.payroll?.viewRuns || 'View Payroll Runs'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/payroll/process`}>
                    {d?.cards?.payroll?.process || 'Process Payroll'} (
                    {pendingPayrollCount})
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timesheet Block */}
          <Card className="border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-500" />
                {d?.cards?.timesheet?.title || 'Timesheets'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.timesheet?.description || 'Staff timesheet tracking and approval'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.timesheet?.details || 'Track staff hours, approve timesheets, calculate overtime, and integrate with payroll.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/timesheet`}>
                    <Clock className="mr-2 h-4 w-4" />
                    {d?.cards?.timesheet?.viewAll || 'View Timesheets'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/timesheet/approve`}>
                    {d?.cards?.timesheet?.approvePending || 'Approve Pending'} (
                    {pendingTimesheetsCount})
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Block */}
          <Card className="border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-indigo-500" />
                {d?.cards?.wallet?.title || 'Wallet Management'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.wallet?.description || 'School and parent wallet system'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.wallet?.details || 'Manage school wallet, track parent wallet balances, and handle top-ups.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/wallet`}>
                    <Wallet className="mr-2 h-4 w-4" />
                    {d?.cards?.wallet?.viewWallets || 'View Wallets'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/wallet/transactions`}>
                    {d?.cards?.wallet?.viewTransactions || 'View Transactions'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Budget Block */}
          <Card className="border-pink-500/20 hover:border-pink-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-pink-500" />
                {d?.cards?.budget?.title || 'Budget Planning'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.budget?.description || 'Budget allocation and variance tracking'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.budget?.details || 'Create budgets, allocate funds by department, track spending, and analyze variance.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/budget`}>
                    <PieChart className="mr-2 h-4 w-4" />
                    {d?.cards?.budget?.viewBudgets || 'View Budgets'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/budget/variance`}>
                    {d?.cards?.budget?.varianceReport || 'Variance Report'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Block */}
          <Card className="border-amber-500/20 hover:border-amber-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                {d?.cards?.expenses?.title || 'Expense Management'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.expenses?.description || 'Expense tracking and approval workflow'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.expenses?.details || 'Submit expenses, manage approval workflow, track reimbursements, and categorize.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/expenses`}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {d?.cards?.expenses?.viewExpenses || 'View Expenses'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/expenses/approve`}>
                    {d?.cards?.expenses?.approvePending || 'Approve Pending'} (
                    {pendingExpensesCount})
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Accounts Block */}
          <Card className="border-slate-500/20 hover:border-slate-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-500" />
                {d?.cards?.accounts?.title || 'Accounting System'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.accounts?.description || 'Double-entry bookkeeping and ledger'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.accounts?.details || 'Manage chart of accounts, journal entries, general ledger, and period closing.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/accounts`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {d?.cards?.accounts?.chartOfAccounts || 'Chart of Accounts'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/accounts/journal`}>
                    {d?.cards?.accounts?.journalEntries || 'Journal Entries'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports Block */}
          <Card className="border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-emerald-500" />
                {d?.cards?.reports?.title || 'Financial Reports'}
              </CardTitle>
              <CardDescription>
                {d?.cards?.reports?.description || 'Comprehensive financial reporting'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.cards?.reports?.details || 'Generate P&L, Balance Sheet, Cash Flow, Trial Balance, and custom reports.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/reports`}>
                    <FileBarChart className="mr-2 h-4 w-4" />
                    {d?.cards?.reports?.viewReports || 'View Reports'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/reports/generate`}>
                    {d?.cards?.reports?.generate || 'Generate Report'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Finance Workflow Guide */}
      <Card>
          <CardHeader>
            <CardTitle>
              {d?.workflow?.title || 'Finance Workflow Guide'}
            </CardTitle>
            <CardDescription>
              {d?.workflow?.description || 'Step-by-step guide to managing school finances'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.steps?.['1']?.title || 'Set Up Accounting System'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.steps?.['1']?.description || 'Configure your chart of accounts, fiscal year, and connect bank accounts.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.steps?.['2']?.title || 'Configure Fee Structures'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.steps?.['2']?.description || 'Define student fee structures, payment plans, scholarships, and fines.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.steps?.['3']?.title || 'Set Up Staff Salary'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.steps?.['3']?.description || 'Create salary structures with allowances and deductions for all staff members.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.steps?.['4']?.title || 'Track Revenue & Expenses'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.steps?.['4']?.description || 'Monitor student payments, process invoices, approve expenses, and reconcile banks.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  5
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.steps?.['5']?.title || 'Process Payroll Monthly'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.steps?.['5']?.description || 'Review timesheets, calculate salaries, generate slips, and process disbursements.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  6
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.steps?.['6']?.title || 'Generate Financial Reports'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.steps?.['6']?.description || 'Create P&L statements, balance sheets, cash flow reports, and analyze performance.'}
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
      </Card>
    </div>
  )
}
