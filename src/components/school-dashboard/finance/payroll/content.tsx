// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  Calendar,
  CircleAlert,
  CircleCheck,
  Clock,
  DollarSign,
  FileText,
  Settings,
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

import {
  DashboardGrid,
  FeatureCard,
  formatCurrency,
  StatsCard,
} from "../lib/dashboard-components"
import { checkCurrentUserPermission } from "../lib/permissions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function PayrollContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

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

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, "payroll", "view")
  const canCreate = await checkCurrentUserPermission(
    schoolId,
    "payroll",
    "create"
  )
  const canProcess = await checkCurrentUserPermission(
    schoolId,
    "payroll",
    "process"
  )
  const canApprove = await checkCurrentUserPermission(
    schoolId,
    "payroll",
    "approve"
  )

  // If user can't view payroll, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.noPermissionPayroll ||
            "You don't have permission to view payroll"}
        </p>
      </div>
    )
  }

  // Get comprehensive payroll stats
  let totalRunsCount = 0
  let pendingRunsCount = 0
  let completedRunsCount = 0
  let totalSlipsCount = 0
  let pendingSlipsCount = 0
  let paidSlipsCount = 0
  let monthlyPayroll = 0

  if (schoolId) {
    try {
      ;[
        totalRunsCount,
        pendingRunsCount,
        completedRunsCount,
        totalSlipsCount,
        pendingSlipsCount,
        paidSlipsCount,
      ] = await Promise.all([
        db.payrollRun.count({ where: { schoolId } }),
        db.payrollRun.count({
          where: { schoolId, status: { in: ["DRAFT", "PENDING_APPROVAL"] } },
        }),
        db.payrollRun.count({
          where: { schoolId, status: "PAID" },
        }),
        db.salarySlip.count({ where: { schoolId } }),
        db.salarySlip.count({
          where: { schoolId, status: { in: ["GENERATED", "REVIEWED"] } },
        }),
        db.salarySlip.count({
          where: { schoolId, status: "PAID" },
        }),
      ])

      // Calculate current month payroll
      const currentMonthStart = new Date()
      currentMonthStart.setDate(1)
      currentMonthStart.setHours(0, 0, 0, 0)

      const payrollAgg = await db.salarySlip.aggregate({
        where: {
          schoolId,
          payPeriodStart: { gte: currentMonthStart },
        },
        _sum: { netSalary: true },
      })

      monthlyPayroll = payrollAgg._sum?.netSalary
        ? Number(payrollAgg._sum.netSalary)
        : 0
    } catch (error) {
      console.error("Error fetching payroll stats:", error)
    }
  }

  const pp = fd?.payrollPage as Record<string, string> | undefined

  return (
    <div className="space-y-6">
      {/* Stats Grid - Uses semantic HTML (h6, h2, small) */}
      <DashboardGrid type="stats">
        <StatsCard
          title={pp?.currentMonthPayroll || "Current Month Payroll"}
          value={formatCurrency(monthlyPayroll)}
          description={pp?.totalNetSalaries || "Total net salaries"}
          icon={DollarSign}
        />
        <StatsCard
          title={pp?.payrollRuns || "Payroll Runs"}
          value={totalRunsCount}
          description={`${completedRunsCount} ${c?.completed || "completed"}`}
          icon={Calendar}
        />
        <StatsCard
          title={c?.pendingApproval || "Pending Approval"}
          value={pendingRunsCount}
          description={`${pendingSlipsCount} ${c?.slips || "slips"}`}
          icon={CircleAlert}
        />
        <StatsCard
          title={pp?.paidOut || "Paid Out"}
          value={paidSlipsCount}
          description={`${pp?.salarySlips || "Salary slips"} / ${totalSlipsCount}`}
          icon={CircleCheck}
        />
      </DashboardGrid>

      {/* Feature Cards Grid */}
      <DashboardGrid type="features">
        <FeatureCard
          title={pp?.payrollRuns || "Payroll Runs"}
          description={
            pp?.createManageRuns || "Create and manage payroll processing runs"
          }
          icon={Calendar}
          isPrimary
          primaryAction={{
            label: pp?.viewRuns || "View Runs",
            href: `/${lang}/finance/payroll/runs`,
            count: totalRunsCount,
          }}
          secondaryAction={
            canCreate
              ? {
                  label: pp?.createNewRun || "Create New Run",
                  href: `/${lang}/finance/payroll/runs/new`,
                }
              : undefined
          }
        />
        <FeatureCard
          title={pp?.salarySlips || "Salary Slips"}
          description={
            pp?.viewManageSlips || "View and manage individual salary slips"
          }
          icon={FileText}
          primaryAction={{
            label: pp?.viewSlips || "View Slips",
            href: `/${lang}/finance/payroll/slips`,
            count: totalSlipsCount,
          }}
          secondaryAction={{
            label: `${pp?.reviewPending || "Review Pending"} (${pendingSlipsCount})`,
            href: `/${lang}/finance/payroll/slips/pending`,
          }}
        />
        {canProcess && (
          <FeatureCard
            title={fd?.payroll?.processPayroll || "Process Payroll"}
            description={
              pp?.startNewPayroll ||
              "Start new payroll processing for current period"
            }
            icon={Users}
            primaryAction={{
              label: fd?.payroll?.processPayroll || "Process Payroll",
              href: `/${lang}/finance/payroll/process`,
            }}
            secondaryAction={{
              label: pp?.batchProcess || "Batch Process",
              href: `/${lang}/finance/payroll/process/batch`,
            }}
          />
        )}
        {canApprove && (
          <FeatureCard
            title={c?.approvalQueue || "Approval Queue"}
            description={
              pp?.reviewApproveRuns || "Review and approve pending payroll runs"
            }
            icon={CircleCheck}
            primaryAction={{
              label: `${c?.approvalQueue || "Approval Queue"} (${pendingRunsCount})`,
              href: `/${lang}/finance/payroll/approval`,
            }}
            secondaryAction={{
              label: c?.approvalHistory || "Approval History",
              href: `/${lang}/finance/payroll/approval/history`,
            }}
          />
        )}
        {canProcess && (
          <FeatureCard
            title={pp?.disbursement || "Disbursement"}
            description={
              pp?.processDisbursements ||
              "Process salary payments and disbursements"
            }
            icon={DollarSign}
            primaryAction={{
              label: pp?.disburseSalaries || "Disburse Salaries",
              href: `/${lang}/finance/payroll/disbursement`,
            }}
            secondaryAction={{
              label: pp?.paymentHistory || "Payment History",
              href: `/${lang}/finance/payroll/disbursement/history`,
            }}
          />
        )}
        <FeatureCard
          title={pp?.payrollSettings || "Payroll Settings"}
          description={
            pp?.configureTaxRules ||
            "Configure tax rates, deductions, and rules"
          }
          icon={Settings}
          primaryAction={{
            label: pp?.payrollSettings || "Payroll Settings",
            href: `/${lang}/finance/payroll/settings`,
          }}
          secondaryAction={{
            label: pp?.taxConfiguration || "Tax Configuration",
            href: `/${lang}/finance/payroll/settings/tax`,
          }}
        />
      </DashboardGrid>

      {/* Quick Actions */}
      {canProcess && (
        <Card>
          <CardHeader>
            <CardTitle>{c?.quickActions || "Quick Actions"}</CardTitle>
            <CardDescription>
              {pp?.commonOperations || "Common payroll operations"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/finance/payroll/process/current-month`}>
                <Clock className="me-2 h-4 w-4" />
                {pp?.processCurrentMonth || "Process Current Month"}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/finance/payroll/slips/generate`}>
                <FileText className="me-2 h-4 w-4" />
                {pp?.generateSlips || "Generate Slips"}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/finance/payroll/reports/summary`}>
                {pp?.payrollSummary || "Payroll Summary"}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/finance/payroll/reports/tax`}>
                {pp?.taxReport || "Tax Report"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
