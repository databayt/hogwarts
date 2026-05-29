// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  Award,
  ChevronRight,
  CircleAlert,
  CreditCard,
  DollarSign,
  FileBarChart,
  TriangleAlert,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { selfHealFeeProvisioning } from "@/lib/fee-provisioning-self-heal"
import { formatCurrency } from "@/lib/i18n-format"
import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    const ov = (dictionary as any)?.finance?.fees?.overview as
      | Record<string, string>
      | undefined
    return (
      <div>
        <p className="text-muted-foreground">
          {ov?.schoolNotFound || "School context not found"}
        </p>
      </div>
    )
  }

  const canView = await checkCurrentUserPermission(schoolId, "fees", "view")
  const canPencil = await checkCurrentUserPermission(schoolId, "fees", "edit")
  const canApprove = await checkCurrentUserPermission(
    schoolId,
    "fees",
    "approve"
  )
  const canCreate = await checkCurrentUserPermission(schoolId, "fees", "create")
  const canExport = await checkCurrentUserPermission(schoolId, "fees", "export")

  // Best-effort: if onboarding's after() was killed before fee provisioning
  // completed, heal it now so the admin sees fees instead of an empty page.
  // Idempotent and silent — returns immediately if nothing to do.
  await selfHealFeeProvisioning(schoolId)

  if (!canView) {
    const ov = (dictionary as any)?.finance?.fees?.overview as
      | Record<string, string>
      | undefined
    return (
      <div>
        <p className="text-muted-foreground">
          {ov?.noPermissionFees || "You don't have permission to view fees"}
        </p>
      </div>
    )
  }

  const schoolForCurrency = await db.school.findUnique({
    where: { id: schoolId },
    select: { currency: true },
  })
  const currency = schoolForCurrency?.currency ?? "USD"

  let feeStructuresCount = 0
  let activeAssignmentsCount = 0
  let paymentsCount = 0
  let totalFeesCollected = 0
  let pendingPayments = 0
  let overduePayments = 0
  let scholarshipsCount = 0
  let finesCount = 0

  try {
    ;[
      feeStructuresCount,
      activeAssignmentsCount,
      paymentsCount,
      scholarshipsCount,
      finesCount,
    ] = await Promise.all([
      db.feeStructure.count({ where: { schoolId } }),
      db.feeAssignment.count({
        where: {
          schoolId,
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        },
      }),
      db.payment.count({ where: { schoolId, status: "SUCCESS" } }),
      db.scholarship.count({ where: { schoolId } }),
      db.fine.count({ where: { schoolId } }),
    ])

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
  }

  const d = (dictionary as any)?.finance
  // Merge both dict sections so individual missing keys fall back to feesPage
  const fp = { ...(d?.feesPage || {}), ...(d?.fees?.overview || {}) } as Record<
    string,
    string
  >
  const c = (d?.common || {}) as Record<string, string>
  const mp = (d?.mainPage || {}) as Record<string, string>

  interface Module {
    show: boolean
    href: string
    icon: typeof CreditCard
    iconBg: string
    iconColor: string
    title: string
    count: number
    countLabel: string
    viewLabel: string
  }

  const modules: Module[] = [
    {
      show: canPencil,
      href: `/${lang}/finance/fees/structures`,
      icon: CreditCard,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
      title: fp.feeStructures || "Fee Structures",
      count: feeStructuresCount,
      countLabel: c.configured || "configured",
      viewLabel: fp.viewStructures || "View Structures",
    },
    {
      show: true,
      href: `/${lang}/finance/fees/payments`,
      icon: DollarSign,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      title: fp.paymentTracking || "Payment Tracking",
      count: paymentsCount,
      countLabel: c.completed || "completed",
      viewLabel: fp.viewPayments || "View Payments",
    },
    {
      show: canPencil,
      href: `/${lang}/finance/fees/assignments`,
      icon: Users,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-500",
      title: fp.studentAssignments || "Student Assignments",
      count: activeAssignmentsCount,
      countLabel: mp.pendingLabel || "pending",
      viewLabel: fp.viewAssignments || "View Assignments",
    },
    {
      show: canApprove,
      href: `/${lang}/finance/fees/scholarships`,
      icon: Award,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
      title: fp.scholarships || "Scholarships",
      count: scholarshipsCount,
      countLabel: c.active?.toLowerCase() || "active",
      viewLabel: fp.viewScholarships || "View Scholarships",
    },
    {
      show: canCreate,
      href: `/${lang}/finance/fees/fines`,
      icon: TriangleAlert,
      iconBg: "bg-destructive/15",
      iconColor: "text-destructive",
      title: fp.finesPenalties || "Fines & Penalties",
      count: finesCount,
      countLabel: mp.unpaid || "issued",
      viewLabel: fp.viewFines || "View Fines",
    },
    {
      show: canExport,
      href: `/${lang}/finance/fees/reports`,
      icon: FileBarChart,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
      title: fp.feeReports || "Fee Reports",
      count: 0,
      countLabel: mp.generated || "generated",
      viewLabel: c.viewReports || "View Reports",
    },
  ]

  const visibleModules = modules.filter((m) => m.show)

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {fp.feesCollected || "Fees Collected"}
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFeesCollected, lang, currency)}
            </div>
            <p className="text-muted-foreground text-xs">
              {fp.completedPayments || "Completed payments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {fp.pendingPayments || "Pending Payments"}
            </CardTitle>
            <CircleAlert className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pendingPayments, lang, currency)}
            </div>
            <p className="text-muted-foreground text-xs">
              {activeAssignmentsCount} {fp.assignments || "assignments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {fp.overduePayments || "Overdue Payments"}
            </CardTitle>
            <TriangleAlert className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overduePayments, lang, currency)}
            </div>
            <p className="text-muted-foreground text-xs">
              {c.requiresAction || fp.requiresAction || "Requires action"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {fp.activeScholarships || "Active Scholarships"}
            </CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scholarshipsCount}</div>
            <p className="text-muted-foreground text-xs">
              {c.availablePrograms ||
                fp.availablePrograms ||
                "Available programs"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modules — compact navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleModules.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.href} className="p-4">
              <CardContent className="space-y-3 p-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${m.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${m.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">{m.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{m.count}</p>
                      <span className="bg-muted text-muted-foreground rounded px-1.5 py-0 text-[10px]">
                        {m.countLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={m.href}
                  className="text-primary inline-flex items-center text-xs hover:underline"
                >
                  {m.viewLabel}{" "}
                  <ChevronRight className="ms-1 h-3 w-3 rtl:rotate-180" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
