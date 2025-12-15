import Link from "next/link"
import {
  CircleAlert,
  CircleCheck,
  DollarSign,
  FolderOpen,
  Receipt,
  TrendingUp,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ExpensesContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  let categoriesCount = 0
  let expensesCount = 0
  let pendingExpensesCount = 0
  let approvedExpensesCount = 0
  let totalExpenses = 0

  if (schoolId) {
    try {
      ;[
        categoriesCount,
        expensesCount,
        pendingExpensesCount,
        approvedExpensesCount,
      ] = await Promise.all([
        db.expenseCategory.count({ where: { schoolId } }),
        db.expense.count({ where: { schoolId } }),
        db.expense.count({ where: { schoolId, status: "PENDING" } }),
        db.expense.count({ where: { schoolId, status: "APPROVED" } }),
      ])

      const expensesAgg = await db.expense.aggregate({
        where: { schoolId, status: "APPROVED" },
        _sum: { amount: true },
      })

      totalExpenses = expensesAgg._sum?.amount
        ? Number(expensesAgg._sum.amount)
        : 0
    } catch (error) {
      console.error("Error fetching expense stats:", error)
    }
  }

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.expenses

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeadingSetter
          title={d?.title || "Expense Management"}
          description={
            d?.description ||
            "Submit expenses, manage approval workflow, and track reimbursements"
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.totalExpenses || "Total Expenses"}
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalExpenses / 100).toLocaleString()}
              </div>
              <p className="text-muted-foreground text-xs">
                {d?.stats?.approved || "Approved expenses"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.submitted || "Submitted"}
              </CardTitle>
              <Receipt className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expensesCount}</div>
              <p className="text-muted-foreground text-xs">
                {approvedExpensesCount} {d?.stats?.approved || "approved"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.pending || "Pending Approval"}
              </CardTitle>
              <CircleAlert className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingExpensesCount}</div>
              <p className="text-muted-foreground text-xs">
                {d?.stats?.requiresReview || "Requires review"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.categories || "Categories"}
              </CardTitle>
              <FolderOpen className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoriesCount}</div>
              <p className="text-muted-foreground text-xs">
                {d?.stats?.configured || "Configured categories"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="text-primary h-5 w-5" />
                {d?.sections?.expenses || "All Expenses"}
              </CardTitle>
              <CardDescription>
                {d?.sections?.expensesDesc ||
                  "View and manage expense submissions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/expenses/all`}>
                  {d?.actions?.viewExpenses || "View Expenses"} ({expensesCount}
                  )
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/expenses/submit`}>
                  {d?.actions?.submit || "Submit Expense"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleCheck className="h-5 w-5" />
                {d?.sections?.approval || "Approval Workflow"}
              </CardTitle>
              <CardDescription>
                {d?.sections?.approvalDesc ||
                  "Review and approve pending expenses"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/expenses/approve`}>
                  {d?.actions?.pending || "Pending"} ({pendingExpensesCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/expenses/approve/bulk`}>
                  {d?.actions?.bulkApprove || "Bulk Approve"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                {d?.sections?.categories || "Expense Categories"}
              </CardTitle>
              <CardDescription>
                {d?.sections?.categoriesDesc || "Organize expenses by category"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/expenses/categories`}>
                  {d?.actions?.categories || "Categories"} ({categoriesCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/expenses/categories/new`}>
                  {d?.actions?.addCategory || "Add Category"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {d?.sections?.reimbursement || "Reimbursement"}
              </CardTitle>
              <CardDescription>
                {d?.sections?.reimbursementDesc ||
                  "Process expense reimbursements"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/expenses/reimbursement`}>
                  {d?.actions?.reimburse || "Process Reimbursement"}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/expenses/reimbursement/pending`}>
                  {d?.actions?.pendingReimbursement || "Pending"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {d?.sections?.reports || "Expense Reports"}
              </CardTitle>
              <CardDescription>
                {d?.sections?.reportsDesc ||
                  "Generate expense analysis reports"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/expenses/reports`}>
                  {d?.actions?.viewReports || "View Reports"}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/expenses/reports/category`}>
                  {d?.actions?.byCategory || "By Category"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleAlert className="h-5 w-5" />
                {d?.sections?.policy || "Expense Policy"}
              </CardTitle>
              <CardDescription>
                {d?.sections?.policyDesc ||
                  "Configure expense rules and limits"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/expenses/policy`}>
                  {d?.actions?.viewPolicy || "View Policy"}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/expenses/policy/limits`}>
                  {d?.actions?.setLimits || "Set Limits"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
