// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  Award,
  CircleAlert,
  CreditCard,
  DollarSign,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { buttonVariants } from "@/components/ui/button"
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

export default async function FeesContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    const c0 = (dictionary as any)?.finance?.common as
      | Record<string, string>
      | undefined
    return (
      <div>
        <p className="text-muted-foreground">
          {c0?.schoolNotFound || "School context not found"}
        </p>
      </div>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, "fees", "view")
  const canCreate = await checkCurrentUserPermission(schoolId, "fees", "create")
  const canPencil = await checkCurrentUserPermission(schoolId, "fees", "edit")
  const canApprove = await checkCurrentUserPermission(
    schoolId,
    "fees",
    "approve"
  )
  const canExport = await checkCurrentUserPermission(schoolId, "fees", "export")

  // If user can't view fees, show empty state
  if (!canView) {
    const c0 = (dictionary as any)?.finance?.common as
      | Record<string, string>
      | undefined
    return (
      <div>
        <p className="text-muted-foreground">
          {c0?.noPermissionFees || "You don't have permission to view fees"}
        </p>
      </div>
    )
  }

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
          where: {
            schoolId,
            status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          },
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
          where: { schoolId, status: "SUCCESS" },
          _sum: { amount: true },
        }),
        db.feeAssignment.aggregate({
          where: { schoolId, status: "PENDING" },
          _sum: { finalAmount: true },
        }),
        db.feeAssignment.aggregate({
          where: { schoolId, status: "OVERDUE" },
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
      console.error("Error fetching fee stats:", error)
      // Return zeros if tables don't exist yet
    }
  }

  const d = (dictionary as any)?.finance
  const fp = d?.feesPage as Record<string, string> | undefined
  const c = d?.common as Record<string, string> | undefined

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {fp?.feesCollected || "Fees Collected"}
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalFeesCollected.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {fp?.completedPayments || "Completed payments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {fp?.pendingPayments || "Pending Payments"}
            </CardTitle>
            <CircleAlert className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pendingPayments.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {activeAssignmentsCount} {fp?.assignments || "assignments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {fp?.overduePayments || "Overdue Payments"}
            </CardTitle>
            <TriangleAlert className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overduePayments.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {c?.requiresAction || "Requires action"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {fp?.activeScholarships || "Active Scholarships"}
            </CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scholarshipsCount}</div>
            <p className="text-muted-foreground text-xs">
              {c?.availablePrograms || "Available programs"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Fee Structures */}
        {canPencil && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {fp?.feeStructures || "Fee Structures"}
              </CardTitle>
              <CardDescription>
                {fp?.defineManageFees ||
                  "Define and manage fee types and amounts"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/${lang}/finance/fees/structures`}
                className={buttonVariants({ className: "w-full" })}
              >
                {`${fp?.viewStructures || "View Structures"} (${feeStructuresCount})`}
              </Link>
              {canCreate && (
                <Link
                  href={`/${lang}/finance/fees/structures/new`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "w-full",
                  })}
                >
                  {fp?.createNewStructure || "Create New Structure"}
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {fp?.paymentTracking || "Payment Tracking"}
            </CardTitle>
            <CardDescription>
              {fp?.recordTrackPayments ||
                "Record and track student fee payments"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href={`/${lang}/finance/fees/payments`}
              className={buttonVariants({ className: "w-full" })}
            >
              {fp?.viewPayments || "View Payments"}
            </Link>
            {canCreate && (
              <Link
                href={`/${lang}/finance/fees/payments/new`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "w-full",
                })}
              >
                {fp?.recordPayment || "Record Payment"}
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Student Assignments */}
        {canPencil && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {fp?.studentAssignments || "Student Assignments"}
              </CardTitle>
              <CardDescription>
                {fp?.assignFeesTrack ||
                  "Assign fees to students and track status"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/${lang}/finance/fees/assignments`}
                className={buttonVariants({ className: "w-full" })}
              >
                {fp?.viewAssignments || "View Assignments"}
              </Link>
              {canCreate && (
                <Link
                  href={`/${lang}/finance/fees/assignments/new`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "w-full",
                  })}
                >
                  {fp?.bulkAssignFees || "Bulk Assign Fees"}
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Scholarships */}
        {canApprove && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {fp?.scholarships || "Scholarships"}
              </CardTitle>
              <CardDescription>
                {fp?.manageScholarships ||
                  "Manage scholarship programs and applications"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/${lang}/finance/fees/scholarships`}
                className={buttonVariants({ className: "w-full" })}
              >
                {`${fp?.viewScholarships || "View Scholarships"} (${scholarshipsCount})`}
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Fines */}
        {canCreate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TriangleAlert className="h-5 w-5" />
                {fp?.finesPenalties || "Fines & Penalties"}
              </CardTitle>
              <CardDescription>
                {fp?.trackManageFines ||
                  "Track and manage student fines and penalties"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/${lang}/finance/fees/fines`}
                className={buttonVariants({ className: "w-full" })}
              >
                {`${fp?.viewFines || "View Fines"} (${finesCount})`}
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Reports */}
        {canExport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {fp?.feeReports || "Fee Reports"}
              </CardTitle>
              <CardDescription>
                {fp?.generateFeeReports ||
                  "Generate fee collection and analysis reports"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/${lang}/finance/reports`}
                className={buttonVariants({ className: "w-full" })}
              >
                {c?.viewReports || "View Reports"}
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
