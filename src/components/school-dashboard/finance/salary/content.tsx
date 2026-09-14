// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  Award,
  BarChart,
  Calculator,
  DollarSign,
  FileText,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { cn } from "@/lib/utils"
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

import { resolveFinanceAccess } from "../guard"
import { formatCompactMoney } from "../lib/format"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

/** Every action this page gates on, resolved in a single pass. */
const SALARY_ACTIONS = ["view", "create", "edit", "export"] as const

export default async function SalaryContent({ dictionary, lang }: Props) {
  // One tenant + session resolution, then all four permissions concurrently.
  const { schoolId, can } = await resolveFinanceAccess("salary", SALARY_ACTIONS)

  const fd = (dictionary as any)?.finance
  const c = fd?.common as Record<string, string> | undefined

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.schoolNotFound || "School context not found"}
        </p>
      </div>
    )
  }

  const {
    view: canView,
    create: canCreate,
    edit: canEdit,
    export: canExport,
  } = can

  // If user can't view salary, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.noPermissionSalary || "You don't have permission to view salary"}
        </p>
      </div>
    )
  }

  // Get comprehensive salary stats
  let activeStructuresCount = 0
  let totalStaffCount = 0
  let averageSalary = 0
  let totalMonthlySalary = 0
  let allowancesCount = 0
  let deductionsCount = 0
  let currency = "USD"

  try {
    // The school row, the four counts and the salary aggregate are
    // independent — one round-trip instead of three.
    const [school, structures, staff, allowances, deductions, salaryAgg] =
      await Promise.all([
        db.school
          .findUnique({
            where: { id: schoolId },
            select: { currency: true },
          })
          .catch(() => null),
        db.salaryStructure.count({
          where: { schoolId, isActive: true },
        }),
        db.teacher.count({ where: { schoolId } }),
        db.salaryAllowance.count({
          where: { schoolId },
        }),
        db.salaryDeduction.count({
          where: { schoolId },
        }),
        db.salaryStructure.aggregate({
          where: { schoolId, isActive: true },
          _sum: { baseSalary: true },
          _avg: { baseSalary: true },
        }),
      ])

    currency = school?.currency ?? "USD"
    activeStructuresCount = structures
    totalStaffCount = staff
    allowancesCount = allowances
    deductionsCount = deductions

    totalMonthlySalary = salaryAgg._sum?.baseSalary
      ? Number(salaryAgg._sum.baseSalary)
      : 0
    averageSalary = salaryAgg._avg?.baseSalary
      ? Number(salaryAgg._avg.baseSalary)
      : 0
  } catch (error) {
    console.error("Error fetching salary stats:", error)
  }

  const sp = fd?.salaryPage as Record<string, string> | undefined

  // Phone: a compact money figure steps down a size so a long amount never
  // breaks its currency word across lines — same threshold as
  // finance/lib/dashboard-components.tsx's StatsCard.
  const statFigureClass = (value: string) =>
    cn(
      "max-md:font-bold max-md:tabular-nums",
      value.length > 10
        ? "max-md:text-base max-md:leading-6"
        : "max-md:text-lg max-md:leading-7"
    )
  const monthlyDisplay = formatCompactMoney(totalMonthlySalary, currency, lang)
  const averageDisplay = formatCompactMoney(averageSalary, currency, lang)

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-4 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {sp?.monthlyPayroll || "Monthly Payroll"}
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div
              className={cn(
                "text-2xl font-bold",
                statFigureClass(monthlyDisplay)
              )}
            >
              {monthlyDisplay}
            </div>
            <p className="text-muted-foreground text-xs max-md:line-clamp-2 max-md:leading-4">
              {sp?.totalBasicSalary || "Total basic salary"}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {sp?.activeStaff || "Active Staff"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:font-bold max-md:tabular-nums">
              {activeStructuresCount}
            </div>
            <p className="text-muted-foreground text-xs max-md:line-clamp-2 max-md:leading-4">
              {sp?.withSalaryStructures || "With salary structures"} /{" "}
              {totalStaffCount}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {sp?.averageSalary || "Average Salary"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div
              className={cn(
                "text-2xl font-bold",
                statFigureClass(averageDisplay)
              )}
            >
              {averageDisplay}
            </div>
            <p className="text-muted-foreground text-xs max-md:line-clamp-2 max-md:leading-4">
              {sp?.perStaffMember || "Per staff member"}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {sp?.components || "Components"}
            </CardTitle>
            <Settings className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:font-bold max-md:tabular-nums">
              {allowancesCount + deductionsCount}
            </div>
            <p className="text-muted-foreground text-xs max-md:line-clamp-2 max-md:leading-4">
              {allowancesCount} {sp?.allowances || "allowances"},{" "}
              {deductionsCount} {sp?.deductions || "deductions"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Sections */}
      <div className="grid gap-6 max-md:gap-3 md:grid-cols-2 lg:grid-cols-3">
        {/* Salary Structures */}
        {canEdit && (
          <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
            <CardHeader className="max-md:p-5 max-md:pb-3">
              <CardTitle className="flex items-center gap-2 max-md:text-base">
                <FileText className="h-5 w-5" />
                {sp?.salaryStructures || "Salary Structures"}
              </CardTitle>
              <CardDescription>
                {sp?.defineManageStructures ||
                  "Define and manage staff salary structures"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/structures`}>
                  {sp?.viewStructures || "View Structures"} (
                  {activeStructuresCount})
                </Link>
              </Button>
              {canCreate && (
                <Button variant="outline" asChild className="w-full" size="sm">
                  <Link href={`/${lang}/finance/salary/structures/new`}>
                    {sp?.createStructure || "Create Structure"}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Allowances */}
        {canEdit && (
          <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
            <CardHeader className="max-md:p-5 max-md:pb-3">
              <CardTitle className="flex items-center gap-2 max-md:text-base">
                <Award className="h-5 w-5" />
                {sp?.allowances || "Allowances"}
              </CardTitle>
              <CardDescription>
                {sp?.manageAllowances || "Manage salary allowances and bonuses"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
              <Button className="w-full" disabled>
                {sp?.viewAllowances || "View Allowances"} ({allowancesCount})
                <span className="text-muted-foreground ms-2 text-xs">
                  {c?.comingSoon}
                </span>
              </Button>
              {canCreate && (
                <Button variant="outline" className="w-full" size="sm" disabled>
                  {sp?.addAllowance || "Add Allowance"}
                  <span className="text-muted-foreground ms-2 text-xs">
                    {c?.comingSoon}
                  </span>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Deductions */}
        {canEdit && (
          <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
            <CardHeader className="max-md:p-5 max-md:pb-3">
              <CardTitle className="flex items-center gap-2 max-md:text-base">
                <TrendingUp className="h-5 w-5" />
                {sp?.deductions || "Deductions"}
              </CardTitle>
              <CardDescription>
                {sp?.manageDeductions ||
                  "Manage salary deductions and contributions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
              <Button className="w-full" disabled>
                {sp?.viewDeductions || "View Deductions"} ({deductionsCount})
                <span className="text-muted-foreground ms-2 text-xs">
                  {c?.comingSoon}
                </span>
              </Button>
              {canCreate && (
                <Button variant="outline" className="w-full" size="sm" disabled>
                  {sp?.addDeduction || "Add Deduction"}
                  <span className="text-muted-foreground ms-2 text-xs">
                    {c?.comingSoon}
                  </span>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Salary Calculator */}
        <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
          <CardHeader className="max-md:p-5 max-md:pb-3">
            <CardTitle className="flex items-center gap-2 max-md:text-base">
              <Calculator className="h-5 w-5" />
              {sp?.salaryCalculator || "Salary Calculator"}
            </CardTitle>
            <CardDescription>
              {sp?.calculateNetSalary || "Calculate net salary with components"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
            <Button className="w-full" disabled>
              <Calculator className="me-2 h-4 w-4" />
              {sp?.openCalculator || "Open Calculator"}
              <span className="text-muted-foreground ms-2 text-xs">
                {c?.comingSoon}
              </span>
            </Button>
            <Button variant="outline" className="w-full" size="sm" disabled>
              {sp?.batchCalculate || "Batch Calculate"}
              <span className="text-muted-foreground ms-2 text-xs">
                {c?.comingSoon}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Salary Reports */}
        {canExport && (
          <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
            <CardHeader className="max-md:p-5 max-md:pb-3">
              <CardTitle className="flex items-center gap-2 max-md:text-base">
                <BarChart className="h-5 w-5" />
                {sp?.salaryReports || "Salary Reports"}
              </CardTitle>
              <CardDescription>
                {sp?.generateSalaryReports ||
                  "Generate salary analysis and reports"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
              <Button className="w-full" disabled>
                {c?.viewReports || "View Reports"}
                <span className="text-muted-foreground ms-2 text-xs">
                  {c?.comingSoon}
                </span>
              </Button>
              <Button variant="outline" className="w-full" size="sm" disabled>
                {sp?.salaryAnalysis || "Salary Analysis"}
                <span className="text-muted-foreground ms-2 text-xs">
                  {c?.comingSoon}
                </span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bulk Operations */}
        {canEdit && (
          <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
            <CardHeader className="max-md:p-5 max-md:pb-3">
              <CardTitle className="flex items-center gap-2 max-md:text-base">
                <Users className="h-5 w-5" />
                {sp?.bulkOperations || "Bulk Operations"}
              </CardTitle>
              <CardDescription>
                {sp?.applySalaryChanges ||
                  "Apply salary changes to multiple staff"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
              <Button className="w-full" disabled>
                {sp?.bulkIncrement || "Bulk Increment"}
                <span className="text-muted-foreground ms-2 text-xs">
                  {c?.comingSoon}
                </span>
              </Button>
              <Button variant="outline" className="w-full" size="sm" disabled>
                {sp?.bulkUpdate || "Bulk Update"}
                <span className="text-muted-foreground ms-2 text-xs">
                  {c?.comingSoon}
                </span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
