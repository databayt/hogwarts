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

import { checkCurrentUserPermission } from "../lib/permissions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function SalaryContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">School context not found</p>
      </div>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, "salary", "view")
  const canCreate = await checkCurrentUserPermission(
    schoolId,
    "salary",
    "create"
  )
  const canEdit = await checkCurrentUserPermission(schoolId, "salary", "edit")
  const canExport = await checkCurrentUserPermission(
    schoolId,
    "salary",
    "export"
  )

  // If user can't view salary, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">
          You don't have permission to view salary
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

  if (schoolId) {
    try {
      ;[
        activeStructuresCount,
        totalStaffCount,
        allowancesCount,
        deductionsCount,
      ] = await Promise.all([
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
      ])

      // Calculate salary totals
      const salaryAgg = await db.salaryStructure.aggregate({
        where: { schoolId, isActive: true },
        _sum: { baseSalary: true },
        _avg: { baseSalary: true },
      })

      totalMonthlySalary = salaryAgg._sum?.baseSalary
        ? Number(salaryAgg._sum.baseSalary)
        : 0
      averageSalary = salaryAgg._avg?.baseSalary
        ? Number(salaryAgg._avg.baseSalary)
        : 0
    } catch (error) {
      console.error("Error fetching salary stats:", error)
    }
  }

  const d = dictionary?.finance?.salary

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Payroll
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalMonthlySalary / 100).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Total basic salary</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStructuresCount}</div>
            <p className="text-muted-foreground text-xs">
              With salary structures / {totalStaffCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Salary
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(averageSalary / 100).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Per staff member</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Components</CardTitle>
            <Settings className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allowancesCount + deductionsCount}
            </div>
            <p className="text-muted-foreground text-xs">
              {allowancesCount} allowances, {deductionsCount} deductions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Salary Structures */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Salary Structures
              </CardTitle>
              <CardDescription>
                Define and manage staff salary structures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/structures`}>
                  View Structures ({activeStructuresCount})
                </Link>
              </Button>
              {canCreate && (
                <Button variant="outline" asChild className="w-full" size="sm">
                  <Link href={`/${lang}/finance/salary/structures/new`}>
                    Create Structure
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Allowances */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Allowances
              </CardTitle>
              <CardDescription>
                Manage salary allowances and bonuses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/allowances`}>
                  View Allowances ({allowancesCount})
                </Link>
              </Button>
              {canCreate && (
                <Button variant="outline" asChild className="w-full" size="sm">
                  <Link href={`/${lang}/finance/salary/allowances/new`}>
                    Add Allowance
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Deductions */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Deductions
              </CardTitle>
              <CardDescription>
                Manage salary deductions and contributions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/deductions`}>
                  View Deductions ({deductionsCount})
                </Link>
              </Button>
              {canCreate && (
                <Button variant="outline" asChild className="w-full" size="sm">
                  <Link href={`/${lang}/finance/salary/deductions/new`}>
                    Add Deduction
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Salary Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Salary Calculator
            </CardTitle>
            <CardDescription>
              Calculate net salary with components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/salary/calculator`}>
                <Calculator className="me-2 h-4 w-4" />
                Open Calculator
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/salary/calculator/batch`}>
                Batch Calculate
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Salary Reports */}
        {canExport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Salary Reports
              </CardTitle>
              <CardDescription>
                Generate salary analysis and reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/reports`}>
                  View Reports
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/salary/reports/analysis`}>
                  Salary Analysis
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bulk Operations */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bulk Operations
              </CardTitle>
              <CardDescription>
                Apply salary changes to multiple staff
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/bulk/increment`}>
                  Bulk Increment
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/salary/bulk/update`}>
                  Bulk Update
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
