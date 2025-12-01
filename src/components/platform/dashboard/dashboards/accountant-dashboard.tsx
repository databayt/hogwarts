import type { Dictionary } from "@/components/internationalization/dictionaries"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuickActions } from "@/components/platform/dashboard/quick-actions"
import { getQuickActionsByRole } from "@/components/platform/dashboard/quick-actions-config"
import { Calendar, DollarSign } from "lucide-react"
import { getTenantContext } from "@/lib/tenant-context"
import {
  AccountantDashboardStats,
  CollectionProgress,
  RevenueBreakdown,
} from "@/components/platform/shared/stats"

interface Props {
  user: {
    id: string
    schoolId?: string | null
  }
  dictionary?: Dictionary["school"]
  locale?: string
}

export async function AccountantDashboard({ user, dictionary, locale = "en" }: Props) {
  // Get tenant context for subdomain
  const { schoolId } = await getTenantContext()

  // Get school subdomain for URL construction with error handling
  let school = null
  try {
    if (schoolId) {
      school = await db.school.findUnique({
        where: { id: schoolId },
        select: { domain: true },
      })
    }
  } catch (error) {
    console.error("[AccountantDashboard] Error fetching school domain:", error)
  }

  // Fetch real data from database
  const [totalInvoices, paidInvoices, unpaidInvoices] = user.schoolId
    ? await Promise.all([
        db.userInvoice.count({ where: { schoolId: user.schoolId } }),
        db.userInvoice.count({ where: { schoolId: user.schoolId, status: "PAID" } }),
        db.userInvoice.count({ where: { schoolId: user.schoolId, status: "UNPAID" } }),
      ])
    : [0, 0, 0]

  // Mock data for unimplemented features
  const mockFeeCollectionStatus = {
    totalFees: 180000,
    collected: 135000,
    outstanding: 45000,
    collectionRate: 75.0,
    overdue: 12000,
  }

  const mockExpenseSummaries = [
    { label: "Staff Salaries", amount: 450000, color: "bg-blue-500" },
    { label: "Facilities", amount: 180000, color: "bg-emerald-500" },
    { label: "Technology", amount: 120000, color: "bg-amber-500" },
    { label: "Supplies", amount: 80000, color: "bg-purple-500" },
    { label: "Other", amount: 150000, color: "bg-slate-500" },
  ]

  const mockTodaysTransactions = [
    { type: "Payment", amount: 2500, description: "Student fee payment", status: "completed" },
    { type: "Refund", amount: -150, description: "Overpayment refund", status: "pending" },
    { type: "Payment", amount: 1800, description: "Parent payment", status: "completed" },
  ]

  const mockPendingPayments = [
    { student: "Emma Johnson", amount: 2500, dueDate: "2024-01-15", status: "overdue" },
    { student: "Michael Brown", amount: 1800, dueDate: "2024-01-20", status: "due-soon" },
    { student: "Sarah Davis", amount: 3200, dueDate: "2024-01-25", status: "upcoming" },
  ]

  const mockFinancialCalendar = [
    { event: "Monthly Report Due", date: "2024-01-31", type: "reporting", priority: "high" },
    { event: "Audit Preparation", date: "2024-02-15", type: "audit", priority: "high" },
    { event: "Tax Filing Deadline", date: "2024-03-15", type: "tax", priority: "critical" },
    { event: "Budget Review", date: "2024-02-28", type: "budget", priority: "medium" },
  ]

  const mockRecentActivities = [
    { action: "Payment processed", amount: 2500, user: "Emma Johnson", timestamp: "1 hour ago" },
    { action: "Invoice generated", amount: 1800, user: "Michael Brown", timestamp: "3 hours ago" },
    { action: "Refund issued", amount: -150, user: "Sarah Davis", timestamp: "5 hours ago" },
    { action: "Payment received", amount: 3200, user: "John Smith", timestamp: "1 day ago" },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Section - Using new reusable component */}
      <AccountantDashboardStats
        feesCollected={mockFeeCollectionStatus.collected}
        feesChange={8.5}
        pendingPayments={mockFeeCollectionStatus.outstanding}
        pendingChange={-12}
        invoicesGenerated={totalInvoices}
        overduePayments={mockFeeCollectionStatus.overdue}
        currency="$"
      />

      {/* Quick Actions */}
      <QuickActions
        actions={getQuickActionsByRole("ACCOUNTANT", dictionary, school?.domain)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Fee Collection Progress */}
        <CollectionProgress
          collected={mockFeeCollectionStatus.collected}
          target={mockFeeCollectionStatus.totalFees}
          outstanding={mockFeeCollectionStatus.outstanding}
          currency="$"
        />

        {/* Revenue Breakdown */}
        <RevenueBreakdown
          categories={mockExpenseSummaries}
          total={mockExpenseSummaries.reduce((sum, cat) => sum + cat.amount, 0)}
          title="Expense Breakdown"
          currency="$"
        />

        {/* Today's Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTodaysTransactions.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">{transaction.type}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      transaction.amount > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }`}
                  >
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <Badge
                    variant={transaction.status === "completed" ? "default" : "secondary"}
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPendingPayments.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{payment.student}</p>
                  <p className="text-sm text-muted-foreground">
                    Due: {new Date(payment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${payment.amount.toFixed(2)}</p>
                  <Badge
                    variant={
                      payment.status === "overdue"
                        ? "destructive"
                        : payment.status === "due-soon"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {payment.status.replace("-", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Financial Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockFinancialCalendar.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{event.event}</p>
                    <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      event.priority === "critical"
                        ? "destructive"
                        : event.priority === "high"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {event.priority}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Financial Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRecentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      activity.amount > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }`}
                  >
                    ${Math.abs(activity.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
