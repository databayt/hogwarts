import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
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
  DollarSign,
  Users,
  TrendingUp,
  Calculator,
  FileText,
  Settings,
  BarChart,
  Award,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function SalaryContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Get comprehensive salary stats
  let activeStructuresCount = 0
  let totalStaffCount = 0
  let averageSalary = 0
  let totalMonthlySalary = 0
  let allowancesCount = 0
  let deductionsCount = 0

  if (schoolId) {
    try {
      ;[activeStructuresCount, totalStaffCount, allowancesCount, deductionsCount] =
        await Promise.all([
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
      console.error('Error fetching salary stats:', error)
    }
  }

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.salary

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Salary Management'}
          description={
            d?.description ||
            'Manage staff salary structures, allowances, deductions, and calculations'
          }
          className="text-start max-w-none"
        />

        {/* Financial Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.monthlyPayroll || 'Monthly Payroll'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalMonthlySalary / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.basicSalaryTotal || 'Total basic salary'}
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
              <div className="text-2xl font-bold">{activeStructuresCount}</div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.withStructures || 'With salary structures'} / {totalStaffCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.avgSalary || 'Average Salary'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(averageSalary / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.perStaff || 'Per staff member'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.components || 'Components'}
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allowancesCount + deductionsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {allowancesCount} {d?.stats?.allowances || 'allowances'}, {deductionsCount}{' '}
                {d?.stats?.deductions || 'deductions'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Sections */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Salary Structures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {d?.sections?.structures || 'Salary Structures'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.structuresDesc ||
                  'Define and manage staff salary structures'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/structures`}>
                  {d?.actions?.viewStructures || 'View Structures'} (
                  {activeStructuresCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/salary/structures/new`}>
                  {d?.actions?.createStructure || 'Create Structure'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Allowances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {d?.sections?.allowances || 'Allowances'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.allowancesDesc ||
                  'Manage salary allowances and bonuses'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/allowances`}>
                  {d?.actions?.viewAllowances || 'View Allowances'} ({allowancesCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/salary/allowances/new`}>
                  {d?.actions?.addAllowance || 'Add Allowance'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {d?.sections?.deductions || 'Deductions'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.deductionsDesc ||
                  'Manage salary deductions and contributions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/deductions`}>
                  {d?.actions?.viewDeductions || 'View Deductions'} ({deductionsCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/salary/deductions/new`}>
                  {d?.actions?.addDeduction || 'Add Deduction'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Salary Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {d?.sections?.calculator || 'Salary Calculator'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.calculatorDesc ||
                  'Calculate net salary with components'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/calculator`}>
                  <Calculator className="mr-2 h-4 w-4" />
                  {d?.actions?.openCalculator || 'Open Calculator'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/salary/calculator/batch`}>
                  {d?.actions?.batchCalculate || 'Batch Calculate'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Salary Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                {d?.sections?.reports || 'Salary Reports'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.reportsDesc ||
                  'Generate salary analysis and reports'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/reports`}>
                  {d?.actions?.viewReports || 'View Reports'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/salary/reports/analysis`}>
                  {d?.actions?.salaryAnalysis || 'Salary Analysis'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Bulk Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {d?.sections?.bulkOps || 'Bulk Operations'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.bulkOpsDesc ||
                  'Apply salary changes to multiple staff'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/salary/bulk/increment`}>
                  {d?.actions?.bulkIncrement || 'Bulk Increment'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/salary/bulk/update`}>
                  {d?.actions?.bulkUpdate || 'Bulk Update'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
