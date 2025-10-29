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
  CreditCard,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Award,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function FeesContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Get comprehensive fee stats
  let feeStructuresCount = 0
  let activeAssignmentsCount = 0
  let totalFeesCollected = 0
  let pendingPayments = 0
  let overduePayments = 0
  let scholarshipsCount = 0
  let finesCount = 0

  if (schoolId) {
    try {
      ;[
        feeStructuresCount,
        activeAssignmentsCount,
        scholarshipsCount,
        finesCount,
      ] = await Promise.all([
        db.feeStructure.count({
          where: { schoolId },
        }),
        db.feeAssignment.count({
          where: { schoolId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
        }),
        db.scholarship.count({
          where: { schoolId },
        }),
        db.fine.count({
          where: { schoolId },
        }),
      ])

      // Calculate financial totals
      const [collectedAgg, pendingAgg, overdueAgg] = await Promise.all([
        db.payment.aggregate({
          where: { schoolId, status: 'SUCCESS' },
          _sum: { amount: true },
        }),
        db.feeAssignment.aggregate({
          where: { schoolId, status: 'PENDING' },
          _sum: { finalAmount: true },
        }),
        db.feeAssignment.aggregate({
          where: { schoolId, status: 'OVERDUE' },
          _sum: { finalAmount: true },
        }),
      ])

      totalFeesCollected = collectedAgg._sum?.amount
        ? Number(collectedAgg._sum.amount)
        : 0
      pendingPayments = pendingAgg._sum?.finalAmount
        ? Number(pendingAgg._sum.finalAmount)
        : 0
      overduePayments = overdueAgg._sum?.finalAmount
        ? Number(overdueAgg._sum.finalAmount)
        : 0
    } catch (error) {
      console.error('Error fetching fee stats:', error)
      // Return zeros if tables don't exist yet
    }
  }

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.fees

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Student Fees Management'}
          description={
            d?.description ||
            'Manage fee structures, track payments, handle scholarships and fines'
          }
          className="text-start max-w-none"
        />

        {/* Financial Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.collected || 'Fees Collected'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalFeesCollected / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.completed || 'Completed payments'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.pending || 'Pending Payments'}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(pendingPayments / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeAssignmentsCount} {d?.stats?.assignments || 'assignments'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.overdue || 'Overdue Payments'}
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(overduePayments / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.requiresAction || 'Requires action'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.activeScholarships || 'Active Scholarships'}
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scholarshipsCount}</div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.available || 'Available programs'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Fee Structures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {d?.sections?.structures || 'Fee Structures'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.structuresDesc ||
                  'Define and manage fee types and amounts'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/fees/structures`}>
                  {d?.actions?.viewStructures || 'View Structures'} (
                  {feeStructuresCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/fees/structures/new`}>
                  {d?.actions?.createStructure || 'Create New Structure'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Payment Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {d?.sections?.payments || 'Payment Tracking'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.paymentsDesc ||
                  'Record and track student fee payments'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/fees/payments`}>
                  {d?.actions?.viewPayments || 'View Payments'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/fees/payments/record`}>
                  {d?.actions?.recordPayment || 'Record Payment'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Student Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {d?.sections?.assignments || 'Student Assignments'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.assignmentsDesc ||
                  'Assign fees to students and track status'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/fees/assignments`}>
                  {d?.actions?.viewAssignments || 'View Assignments'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/fees/assignments/bulk`}>
                  {d?.actions?.bulkAssign || 'Bulk Assign Fees'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Scholarships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {d?.sections?.scholarships || 'Scholarships'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.scholarshipsDesc ||
                  'Manage scholarship programs and applications'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/fees/scholarships`}>
                  {d?.actions?.viewScholarships || 'View Scholarships'} (
                  {scholarshipsCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/fees/scholarships/applications`}>
                  {d?.actions?.viewApplications || 'Review Applications'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Fines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {d?.sections?.fines || 'Fines & Penalties'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.finesDesc ||
                  'Track and manage student fines and penalties'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/fees/fines`}>
                  {d?.actions?.viewFines || 'View Fines'} ({finesCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/fees/fines/new`}>
                  {d?.actions?.issueFine || 'Issue Fine'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {d?.sections?.reports || 'Fee Reports'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.reportsDesc ||
                  'Generate fee collection and analysis reports'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/fees/reports`}>
                  {d?.actions?.viewReports || 'View Reports'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/fees/reports/collection`}>
                  {d?.actions?.collectionReport || 'Collection Report'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
