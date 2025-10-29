import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'
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
import {
  FileText,
  Receipt,
  Building2,
  CreditCard,
  DollarSign,
  Users,
  Clock,
  Wallet,
  PieChart,
  TrendingUp,
  BookOpen,
  FileBarChart,
  AlertCircle,
  CheckCircle,
  Calendar,
  Banknote,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

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

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.dashboard

  // Define finance page navigation
  const financePages: PageNavItem[] = [
    { name: 'Overview', href: `/${lang}/finance` },
    { name: 'Invoice', href: `/${lang}/finance/invoice` },
    { name: 'Receipt', href: `/${lang}/finance/receipt` },
    { name: 'Banking', href: `/${lang}/finance/banking` },
    { name: 'Fees', href: `/${lang}/finance/fees` },
    { name: 'Salary', href: `/${lang}/finance/salary` },
    { name: 'Payroll', href: `/${lang}/finance/payroll` },
    { name: 'Timesheet', href: `/${lang}/finance/timesheet` },
    { name: 'Wallet', href: `/${lang}/finance/wallet` },
    { name: 'Budget', href: `/${lang}/finance/budget` },
    { name: 'Expenses', href: `/${lang}/finance/expenses` },
    { name: 'Accounts', href: `/${lang}/finance/accounts` },
    { name: 'Reports', href: `/${lang}/finance/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        className="text-start max-w-none"
      />
      <PageNav pages={financePages} />

        {/* Overview Stats - Financial Health */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.totalRevenue || 'Total Revenue'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalRevenue / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.fromCompletedPayments || 'From completed payments'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.totalExpenses || 'Total Expenses'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalExpenses / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.approvedExpenses || 'Approved expenses'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.pendingPayments || 'Pending Payments'}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(pendingPayments / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.awaitingProcessing || 'Awaiting processing'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.netBalance || 'Net Balance'}
              </CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${((totalRevenue - totalExpenses) / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.revenueMinusExpenses || 'Revenue minus expenses'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Module Activity Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.invoices || 'Invoices'}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoicesCount}</div>
              <p className="text-xs text-muted-foreground">
                {unpaidInvoices} {d?.stats?.unpaid || 'unpaid'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.bankAccounts || 'Bank Accounts'}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bankAccountsCount}</div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.connectedAccounts || 'Connected accounts'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.activeStaff || 'Active Staff'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teachersWithSalaryCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.withSalaryStructures || 'With salary structures'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.pendingActions || 'Pending Actions'}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingPayrollCount + pendingTimesheetsCount + pendingExpensesCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.requiresApproval || 'Requires approval'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Finance Sub-Blocks Navigation */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Invoice Block */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {d?.blocks?.invoice?.title || 'Invoicing'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.invoice?.description ||
                  'Client invoicing and billing management'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.invoice?.details ||
                  'Create professional invoices, track payments, and manage client billing.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href={`/${lang}/finance/invoice`}>
                    <FileText className="mr-2 h-4 w-4" />
                    {d?.blocks?.invoice?.viewAll || 'View All Invoices'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/invoice/new`}>
                    {d?.blocks?.invoice?.createNew || 'Create Invoice'}
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
                {d?.blocks?.receipt?.title || 'Receipts'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.receipt?.description ||
                  'Receipt generation and expense tracking'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.receipt?.details ||
                  'Generate receipts, scan expenses with AI OCR, and track all transactions.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/receipt`}>
                    <Receipt className="mr-2 h-4 w-4" />
                    {d?.blocks?.receipt?.viewAll || 'View All Receipts'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/receipt/upload`}>
                    {d?.blocks?.receipt?.upload || 'Upload Receipt'}
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
                {d?.blocks?.banking?.title || 'Banking'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.banking?.description ||
                  'Bank accounts and transaction management'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.banking?.details ||
                  'Connect bank accounts, track transactions, manage transfers, and reconcile.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/banking`}>
                    <Building2 className="mr-2 h-4 w-4" />
                    {d?.blocks?.banking?.viewAll || 'View Accounts'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/banking/connect`}>
                    {d?.blocks?.banking?.connect || 'Connect Bank'}
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
                {d?.blocks?.fees?.title || 'Student Fees'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.fees?.description ||
                  'Fee structures and student payment tracking'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.fees?.details ||
                  'Manage fee structures, track student payments, handle scholarships and fines.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/fees`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {d?.blocks?.fees?.viewAll || 'View Fee Structures'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/fees/payments`}>
                    {d?.blocks?.fees?.payments || 'Track Payments'}
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
                {d?.blocks?.salary?.title || 'Salary Management'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.salary?.description ||
                  'Staff salary structures and calculations'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.salary?.details ||
                  'Define salary structures, manage allowances and deductions, calculate pay.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/salary`}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    {d?.blocks?.salary?.viewAll || 'View Structures'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/salary/calculator`}>
                    {d?.blocks?.salary?.calculator || 'Salary Calculator'}
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
                {d?.blocks?.payroll?.title || 'Payroll Processing'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.payroll?.description ||
                  'Payroll runs and salary slip generation'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.payroll?.details ||
                  'Process payroll, generate salary slips, calculate taxes, and handle disbursements.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/payroll`}>
                    <Users className="mr-2 h-4 w-4" />
                    {d?.blocks?.payroll?.viewAll || 'View Payroll Runs'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/payroll/process`}>
                    {d?.blocks?.payroll?.process || 'Process Payroll'} (
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
                {d?.blocks?.timesheet?.title || 'Timesheets'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.timesheet?.description ||
                  'Staff timesheet tracking and approval'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.timesheet?.details ||
                  'Track staff hours, approve timesheets, calculate overtime, and integrate with payroll.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/timesheet`}>
                    <Clock className="mr-2 h-4 w-4" />
                    {d?.blocks?.timesheet?.viewAll || 'View Timesheets'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/timesheet/approve`}>
                    {d?.blocks?.timesheet?.approve || 'Approve Pending'} (
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
                {d?.blocks?.wallet?.title || 'Wallet Management'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.wallet?.description ||
                  'School and parent wallet system'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.wallet?.details ||
                  'Manage school wallet, track parent wallet balances, and handle top-ups.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/wallet`}>
                    <Wallet className="mr-2 h-4 w-4" />
                    {d?.blocks?.wallet?.viewAll || 'View Wallets'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/wallet/transactions`}>
                    {d?.blocks?.wallet?.transactions || 'View Transactions'}
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
                {d?.blocks?.budget?.title || 'Budget Planning'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.budget?.description ||
                  'Budget allocation and variance tracking'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.budget?.details ||
                  'Create budgets, allocate funds by department, track spending, and analyze variance.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/budget`}>
                    <PieChart className="mr-2 h-4 w-4" />
                    {d?.blocks?.budget?.viewAll || 'View Budgets'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/budget/variance`}>
                    {d?.blocks?.budget?.variance || 'Variance Report'}
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
                {d?.blocks?.expenses?.title || 'Expense Management'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.expenses?.description ||
                  'Expense tracking and approval workflow'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.expenses?.details ||
                  'Submit expenses, manage approval workflow, track reimbursements, and categorize.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/expenses`}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {d?.blocks?.expenses?.viewAll || 'View Expenses'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/expenses/approve`}>
                    {d?.blocks?.expenses?.approve || 'Approve Pending'} (
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
                {d?.blocks?.accounts?.title || 'Accounting System'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.accounts?.description ||
                  'Double-entry bookkeeping and ledger'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.accounts?.details ||
                  'Manage chart of accounts, journal entries, general ledger, and period closing.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/accounts`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {d?.blocks?.accounts?.viewAll || 'Chart of Accounts'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/accounts/journal`}>
                    {d?.blocks?.accounts?.journal || 'Journal Entries'}
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
                {d?.blocks?.reports?.title || 'Financial Reports'}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.reports?.description ||
                  'Comprehensive financial reporting'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {d?.blocks?.reports?.details ||
                  'Generate P&L, Balance Sheet, Cash Flow, Trial Balance, and custom reports.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/finance/reports`}>
                    <FileBarChart className="mr-2 h-4 w-4" />
                    {d?.blocks?.reports?.viewAll || 'View Reports'}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/finance/reports/generate`}>
                    {d?.blocks?.reports?.generate || 'Generate Report'}
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
              {d?.workflow?.description ||
                'Step-by-step guide to managing school finances'}
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
                    {d?.workflow?.step1?.title || 'Set Up Accounting System'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.step1?.description ||
                      'Configure your chart of accounts, fiscal year, and connect bank accounts.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.step2?.title || 'Configure Fee Structures'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.step2?.description ||
                      'Define student fee structures, payment plans, scholarships, and fines.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.step3?.title || 'Set Up Staff Salary'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.step3?.description ||
                      'Create salary structures with allowances and deductions for all staff members.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.step4?.title || 'Track Revenue & Expenses'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.step4?.description ||
                      'Monitor student payments, process invoices, approve expenses, and reconcile banks.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  5
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.step5?.title || 'Process Payroll Monthly'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.step5?.description ||
                      'Review timesheets, calculate salaries, generate slips, and process disbursements.'}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  6
                </div>
                <div>
                  <h3 className="font-medium">
                    {d?.workflow?.step6?.title || 'Generate Financial Reports'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {d?.workflow?.step6?.description ||
                      'Create P&L statements, balance sheets, cash flow reports, and analyze performance.'}
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
  )
}
