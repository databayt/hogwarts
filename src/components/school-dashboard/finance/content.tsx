import Image from "next/image"
import Link from "next/link"
import {
  ChevronRight,
  CircleAlert,
  CreditCard,
  DollarSign,
  FileBarChart,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { AreaChartStacked } from "@/components/school-dashboard/dashboard/chart-area-stacked"
import { InteractiveBarChart } from "@/components/school-dashboard/dashboard/chart-interactive-bar"
import { RadialTextChart } from "@/components/school-dashboard/dashboard/chart-radial-text"

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
        db.payrollRun
          .count({
            where: { schoolId, status: { in: ["DRAFT", "PENDING_APPROVAL"] } },
          })
          .catch(() => 0),
        db.timesheetEntry
          .count({
            where: { schoolId, status: "SUBMITTED" },
          })
          .catch(() => 0),
        db.wallet.count({ where: { schoolId } }).catch(() => 0),
        db.budget
          .count({
            where: { schoolId, status: "ACTIVE" },
          })
          .catch(() => 0),
        db.expense
          .count({
            where: { schoolId, status: "PENDING" },
          })
          .catch(() => 0),
        db.chartOfAccount.count({ where: { schoolId } }).catch(() => 0),
        db.financialReport.count({ where: { schoolId } }).catch(() => 0),
      ])

      // Calculate financial totals
      const [revenueAgg, expensesAgg, pendingPaymentsAgg, unpaidInvoicesAgg] =
        await Promise.all([
          db.payment
            .aggregate({
              where: { schoolId, status: "SUCCESS" },
              _sum: { amount: true },
            })
            .catch(() => ({ _sum: { amount: null } })),
          db.expense
            .aggregate({
              where: { schoolId, status: "APPROVED" },
              _sum: { amount: true },
            })
            .catch(() => ({ _sum: { amount: null } })),
          db.payment
            .aggregate({
              where: { schoolId, status: "PENDING" },
              _sum: { amount: true },
            })
            .catch(() => ({ _sum: { amount: null } })),
          db.userInvoice
            .count({
              where: { schoolId, status: { in: ["UNPAID", "OVERDUE"] } },
            })
            .catch(() => 0),
        ])

      totalRevenue = revenueAgg._sum.amount?.toNumber() || 0
      totalExpenses = expensesAgg._sum.amount?.toNumber() || 0
      pendingPayments = pendingPaymentsAgg._sum.amount?.toNumber() || 0
      unpaidInvoices = unpaidInvoicesAgg
    } catch (error) {
      console.error("Error fetching finance data:", error)
      // Continue with zero values if database queries fail
    }
  }

  const d = dictionary?.finance

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
            className="h-auto w-full max-w-md"
            priority
          />
        </div>

        {/* 2x2 Grid - Other Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.stats?.totalRevenue || "Total Revenue"}
              </CardTitle>
              <TrendingUp className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                ${Math.floor(totalRevenue / 100).toLocaleString()}
              </div>
              <p className="text-muted-foreground text-xs">
                {d?.stats?.fromCompletedPayments || "Completed"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.stats?.totalExpenses || "Total Expenses"}
              </CardTitle>
              <DollarSign className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                ${Math.floor(totalExpenses / 100).toLocaleString()}
              </div>
              <p className="text-muted-foreground text-xs">
                {d?.stats?.approvedExpenses || "Approved"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.stats?.pendingPayments || "Pending"}
              </CardTitle>
              <CircleAlert className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                ${Math.floor(pendingPayments / 100).toLocaleString()}
              </div>
              <p className="text-muted-foreground text-xs">
                {d?.stats?.awaitingProcessing || "Awaiting"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.stats?.unpaidInvoices || "Unpaid"}
              </CardTitle>
              <FileText className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{unpaidInvoices}</div>
              <p className="text-muted-foreground text-xs">
                {d?.stats?.invoicesOutstanding || "Invoices"}
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

      {/* Finance Quick Look */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Invoicing */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 flex h-10 w-10 items-center justify-center rounded-lg">
                <FileText className="text-primary h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {d?.cards?.invoicing?.title || "Invoicing"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{invoicesCount}</p>
                  {unpaidInvoices > 0 && (
                    <span className="bg-destructive/10 text-destructive rounded px-1.5 py-0 text-[10px]">
                      {unpaidInvoices} unpaid
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/invoice`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {d?.cards?.invoicing?.viewAll || "View All"}{" "}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Fee Collection */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {d?.cards?.fees?.title || "Fee Collection"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {studentsWithFeesCount}
                  </p>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0 text-[10px]">
                    students
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/fees`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {d?.cards?.fees?.viewStructures || "View Fees"}{" "}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Payroll */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/15">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {d?.cards?.payroll?.title || "Payroll"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {teachersWithSalaryCount}
                  </p>
                  {pendingPayrollCount > 0 && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600">
                      {pendingPayrollCount} pending
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/payroll`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {d?.cards?.payroll?.viewRuns || "View Payroll"}{" "}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                <FileBarChart className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {d?.cards?.reports?.title || "Reports"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{reportsCount}</p>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0 text-[10px]">
                    generated
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/reports`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {d?.cards?.reports?.viewReports || "View Reports"}{" "}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/${lang}/finance/invoice/new`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary group-hover:bg-primary/20 rounded-lg p-2 transition-colors">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d?.cards?.invoicing?.create || "Create Invoice"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Bill clients & students
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${lang}/finance/payroll/process`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500 transition-colors group-hover:bg-orange-500/20">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d?.cards?.payroll?.process || "Process Payroll"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Run monthly payroll
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${lang}/finance/expenses`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500 transition-colors group-hover:bg-amber-500/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d?.cards?.expenses?.title || "Track Expenses"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Approve & categorize
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${lang}/finance/reports/generate`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 transition-colors group-hover:bg-blue-500/20">
                  <FileBarChart className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d?.cards?.reports?.generate || "Generate Report"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    P&L, Balance Sheet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
