// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { format, isToday, isTomorrow } from "date-fns"
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react"

import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getFinancialSummary } from "./actions"
import { ActivityRings } from "./activity-rings"
import { ChartSection } from "./chart-section"
import { EmptyState } from "./empty-state"
import { InvoiceHistorySection } from "./invoice-history-section"
import { MetricCard } from "./metric-card"
import { PerformanceGauge } from "./performance-gauge"
import { ProgressCard } from "./progress-card"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { ResourceUsageSection } from "./resource-usage-section"
import { SectionHeading } from "./section-heading"

interface AccountantDashboardProps {
  user: {
    id: string
    email?: string | null
    role?: string
    schoolId?: string | null
    name?: string
  }
  dictionary?: Dictionary["school"]
  locale?: string
}

export async function AccountantDashboard({
  user,
  dictionary,
  locale = "en",
}: AccountantDashboardProps) {
  // Wrap entire component in try-catch for comprehensive error handling (like AdminDashboard)
  try {
    // The Upcoming/Weather hero and the Quick Look row are hidden on this
    // dashboard, so their fetches (getQuickLookData, getWeatherData) are not
    // made here — restore both alongside the JSX below.

    // Get tenant context for subdomain with error handling
    let schoolId: string | null = null
    try {
      const tenantContext = await getTenantContext()
      schoolId = tenantContext.schoolId
    } catch (error) {
      console.error(
        "[AccountantDashboard] Error getting tenant context:",
        error
      )
    }

    // Get school subdomain for URL construction with error handling
    let school: { domain: string | null; name: string | null } | null = null
    try {
      if (schoolId) {
        const { db } = await import("@/lib/db")
        const id = schoolId
        school = await db.school.findUnique({
          where: { id },
          select: { domain: true, name: true },
        })
      }
    } catch (error) {
      console.error(
        "[AccountantDashboard] Error fetching school domain:",
        error
      )
    }

    // Fetch real invoice data from database with error handling
    let totalInvoices = 0
    let paidInvoices = 0
    let unpaidInvoices = 0
    try {
      if (user.schoolId) {
        const { db } = await import("@/lib/db")
        const [total, paid, unpaid] = await Promise.all([
          db.userInvoice.count({ where: { schoolId: user.schoolId } }),
          db.userInvoice.count({
            where: { schoolId: user.schoolId, status: "PAID" },
          }),
          db.userInvoice.count({
            where: { schoolId: user.schoolId, status: "UNPAID" },
          }),
        ])
        totalInvoices = total
        paidInvoices = paid
        unpaidInvoices = unpaid
      }
    } catch (error) {
      console.error("[AccountantDashboard] Error fetching invoice data:", error)
    }

    // Fetch financial summary from centralized server action
    let financialData
    try {
      financialData = await getFinancialSummary()
    } catch (error) {
      console.error(
        "[AccountantDashboard] Error fetching financial summary:",
        error
      )
    }

    // Destructure with defaults for error handling
    const {
      revenue = { total: 0, pending: 0, overdue: 0, collectionRate: 0 },
      expenses = { total: 0, categories: [], budgetUtilization: 0 },
      budget = {
        allocated: 0,
        remaining: 0,
        utilizationRate: 0,
        status: "unknown",
      },
      recentTransactions = [],
      defaulters = [],
    } = financialData || {}

    // Map real data to display format with fallback
    const feeCollection = {
      totalFees: revenue.total + revenue.pending + revenue.overdue,
      collected: revenue.total,
      outstanding: revenue.pending,
      collectionRate: revenue.collectionRate,
      overdue: revenue.overdue,
    }

    // Map recent transactions from real data
    const todaysTransactions =
      recentTransactions.length > 0
        ? recentTransactions
            .slice(0, 4)
            .map(
              (t: {
                id: string
                type: string
                amount: number
                date: Date
                studentName?: string
                description?: string
                status?: string
              }) => ({
                type: t.type === "fee_payment" ? "Payment" : "Expense",
                amount: t.amount,
                description: t.studentName
                  ? `Fee payment - ${t.studentName}`
                  : t.description || "Transaction",
                status: t.status === "completed" ? "completed" : "pending",
                time: format(t.date, "h:mm a"),
              })
            )
        : []

    // Map defaulters to pending payments format
    const pendingPaymentRows =
      defaulters.length > 0
        ? defaulters
            .slice(0, 4)
            .map(
              (d: {
                id: string
                name: string
                class: string
                outstandingAmount: number
                monthsOverdue: number
                lastPaymentDate: Date | null
              }) => ({
                student: d.name,
                grade: d.class,
                amount: d.outstandingAmount,
                dueDate:
                  d.lastPaymentDate ||
                  new Date(
                    Date.now() - d.monthsOverdue * 30 * 24 * 60 * 60 * 1000
                  ),
                status: d.monthsOverdue > 1 ? "overdue" : "due-soon",
              })
            )
        : []

    // Activity rings for financial health
    const financialRings = [
      {
        label: "Collection",
        value: feeCollection.collectionRate,
        color: "#22c55e",
        current: feeCollection.collected,
        target: feeCollection.totalFees,
        unit: "collected",
      },
      {
        label: "Invoices",
        value: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
        color: "#3b82f6",
        current: paidInvoices,
        target: totalInvoices,
        unit: "paid",
      },
      {
        label: "Outstanding",
        value: Math.max(
          0,
          100 - (feeCollection.outstanding / feeCollection.totalFees) * 100
        ),
        color: feeCollection.outstanding > 50000 ? "#ef4444" : "#f59e0b",
        current: feeCollection.outstanding,
        target: 0,
        unit: "pending",
      },
    ]

    // Calculate totals for today
    const todayTotal = todaysTransactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0)

    return (
      <div className="space-y-8">
        {/* ============ SHARED SECTIONS (the student dashboard's order) ======
            The Upcoming/Weather hero and the Quick Look row of announcements /
            events / notifications / messages are hidden here, as they are on
            the student and teacher dashboards. Restore by putting the JSX back
            and re-importing `Upcoming`, `Weather`, `QuickLookSection`,
            `getQuickLookData` and `getWeatherData`. */}
        <div className="space-y-6">
          {/* Quick Actions — from `md` up only. Below it the phone dashboard
              shows this same section near the top instead
              (`phone-quick-actions.tsx`), where a thumb reaches it; two copies
              at once would be the same four tiles twice. */}
          <section className="hidden md:block">
            <SectionHeading title="Quick Actions" />
            <QuickActions
              actions={getQuickActionsByRole(
                "ACCOUNTANT",
                school?.domain ?? undefined
              )}
              locale={locale}
            />
          </section>

          {/* Analytics, directly under the quick actions rather than below the
              two tables — the order the student dashboard settled on. */}
          <ChartSection role="ACCOUNTANT" />

          <ResourceUsageSection role="ACCOUNTANT" />

          <InvoiceHistorySection role="ACCOUNTANT" />
        </div>

        {/* ============ ACCOUNTANT-SPECIFIC SECTIONS ============ */}
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            title="Fees Collected"
            value={`$${(feeCollection.collected / 1000).toFixed(0)}K`}
            iconName="DollarSign"
            iconColor="text-emerald-500"
            href={`/${locale}/finance`}
          />
          <MetricCard
            title="Outstanding"
            value={`$${(feeCollection.outstanding / 1000).toFixed(0)}K`}
            iconName="Clock"
            iconColor="text-amber-500"
            href={`/${locale}/finance`}
          />
          <MetricCard
            title="Total Invoices"
            value={totalInvoices}
            iconName="FileText"
            iconColor="text-blue-500"
            href={`/${locale}/finance/invoice`}
          />
          <MetricCard
            title="Overdue"
            value={`$${(feeCollection.overdue / 1000).toFixed(0)}K`}
            iconName="Bell"
            iconColor="text-destructive"
            href={`/${locale}/finance`}
          />
        </div>

        {/* The "Revenue vs Expenses" chart and the "Weekly Collections" chart
            stood here and were removed 2026-09-12: five of the six months and
            every one of the five days were written into this file by hand, and
            a made-up number on a finance dashboard is worse than no number.
            They come back when a query returns the real series — the charts
            themselves (`revenue-chart.tsx`, `weekly-chart.tsx`) are untouched.

            What is left of the two rows is real: the rings read the school's
            own collection rate and invoice counts, the gauge the same rate. */}
        <div className="grid gap-6 md:grid-cols-2">
          <ActivityRings activities={financialRings} title="Financial Health" />

          <PerformanceGauge
            value={Math.round(feeCollection.collectionRate)}
            label="Collection Rate"
            description="Target: 95%"
            maxValue={100}
            color="hsl(142, 76%, 36%)"
          />
        </div>

        {/* Transactions and Payments Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Today&apos;s Transactions
              </CardTitle>
              <Badge variant="outline">{format(new Date(), "MMM d")}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysTransactions.length > 0 ? (
                todaysTransactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${transaction.amount > 0 ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950"}`}
                      >
                        {transaction.amount > 0 ? (
                          <ArrowDownRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="text-destructive h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-muted-foreground text-sm">
                          {transaction.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p
                        className={`font-bold ${
                          transaction.amount > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}$
                        {Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          transaction.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : ""
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="DollarSign"
                  title="No transactions today"
                  description="Transactions will appear here"
                />
              )}
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Pending Payments</CardTitle>
              <Link
                href={`/${locale}/finance`}
                className="text-primary flex items-center gap-1 text-sm hover:underline"
              >
                View all <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingPaymentRows.length > 0 ? (
                pendingPaymentRows.map((payment, index) => {
                  const dueDate = new Date(payment.dueDate)
                  const isOverdue = dueDate < new Date()
                  const isDueToday = isToday(dueDate)
                  const isDueTomorrow = isTomorrow(dueDate)

                  return (
                    <div
                      key={index}
                      className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{payment.student}</p>
                        <p className="text-muted-foreground text-sm">
                          {payment.grade} • Due: {format(dueDate, "MMM d")}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-bold">
                          ${payment.amount.toLocaleString()}
                        </p>
                        <Badge
                          variant={
                            isOverdue
                              ? "destructive"
                              : isDueToday || isDueTomorrow
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {isOverdue
                            ? "Overdue"
                            : isDueToday
                              ? "Due Today"
                              : isDueTomorrow
                                ? "Tomorrow"
                                : format(dueDate, "MMM d")}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              ) : (
                <EmptyState
                  iconName="FileText"
                  title="No pending payments"
                  description="All payments are up to date"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* A "Financial Calendar" card stood here and was removed
            2026-09-12: its four deadlines — monthly report, audit prep, tax
            filing, budget review — were written into this file at fixed
            offsets from today, for every school. No model backs them yet. */}

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${(feeCollection.collected / 1000).toFixed(0)}K
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Total Collected
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  ${(feeCollection.outstanding / 1000).toFixed(0)}K
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Outstanding
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {totalInvoices}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">Invoices</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-primary text-3xl font-bold">
                  {feeCollection.collectionRate.toFixed(0)}%
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Collection Rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <ProgressCard
            title="Fee Collection"
            current={feeCollection.collected}
            total={feeCollection.totalFees}
            unit="collected"
            iconName="DollarSign"
            showPercentage
          />
          <ProgressCard
            title="Invoices Paid"
            current={paidInvoices}
            total={Math.max(totalInvoices, 1)}
            unit="invoices"
            iconName="FileText"
            showPercentage
          />
        </div>
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[AccountantDashboard] Rendering error:", renderError)
    const errorMessage =
      renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack =
      renderError instanceof Error ? renderError.stack : undefined
    console.error("[AccountantDashboard] Error message:", errorMessage)
    console.error("[AccountantDashboard] Error stack:", errorStack)
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">Dashboard Rendering Error</h3>
            <p className="text-muted-foreground mb-2">
              An error occurred while rendering the dashboard.
            </p>
            <pre className="bg-muted max-h-40 overflow-auto rounded p-2 text-xs">
              {errorMessage}
            </pre>
          </CardContent>
        </Card>
      </div>
    )
  }
}
