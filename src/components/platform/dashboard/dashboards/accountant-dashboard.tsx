import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, CreditCard, FileText, TrendingUp, AlertTriangle, Calendar, Calculator, Receipt } from "lucide-react";

interface AccountantDashboardProps {
  user: any;
}

export async function AccountantDashboard({ user }: AccountantDashboardProps) {
  // Fetch real data from database
  const [totalInvoices, paidInvoices, unpaidInvoices] = await Promise.all([
    db.userInvoice.count({ where: { schoolId: user.schoolId } }),
    db.userInvoice.count({ where: { schoolId: user.schoolId, status: "PAID" } }),
    db.userInvoice.count({ where: { schoolId: user.schoolId, status: "UNPAID" } })
  ]);

  // Mock data for unimplemented features
  const mockFinancialHealthMetrics = {
    totalRevenue: 1250000,
    outstandingPayments: 45000,
    monthlyGrowth: 8.5,
    profitMargin: 22.3
  };

  const mockTodaysTransactions = [
    { type: "Payment", amount: 2500, description: "Student fee payment", status: "completed" },
    { type: "Refund", amount: -150, description: "Overpayment refund", status: "pending" },
    { type: "Payment", amount: 1800, description: "Parent payment", status: "completed" }
  ];

  const mockFeeCollectionStatus = {
    totalFees: 180000,
    collected: 135000,
    outstanding: 45000,
    collectionRate: 75.0,
    overdue: 12000
  };

  const mockPendingPayments = [
    { student: "Emma Johnson", amount: 2500, dueDate: "2024-01-15", status: "overdue" },
    { student: "Michael Brown", amount: 1800, dueDate: "2024-01-20", status: "due-soon" },
    { student: "Sarah Davis", amount: 3200, dueDate: "2024-01-25", status: "upcoming" }
  ];

  const mockExpenseSummaries = [
    { category: "Staff Salaries", amount: 450000, percentage: 45.9, trend: "stable" },
    { category: "Facilities", amount: 180000, percentage: 18.4, trend: "up" },
    { category: "Technology", amount: 120000, percentage: 12.2, trend: "up" },
    { category: "Supplies", amount: 80000, percentage: 8.2, trend: "down" },
    { category: "Other", amount: 150000, percentage: 15.3, trend: "stable" }
  ];

  const mockBudgetVariance = {
    allocated: 1000000,
    actual: 980000,
    variance: 20000,
    variancePercentage: 2.0,
    status: "Under Budget"
  };

  const mockPaymentTrends = [
    { month: "Jan", collected: 125000, target: 120000, trend: "up" },
    { month: "Feb", collected: 118000, target: 120000, trend: "down" },
    { month: "Mar", collected: 132000, target: 120000, trend: "up" },
    { month: "Apr", collected: 128000, target: 120000, trend: "up" }
  ];

  const mockFinancialCalendar = [
    { event: "Monthly Report Due", date: "2024-01-31", type: "reporting", priority: "high" },
    { event: "Audit Preparation", date: "2024-02-15", type: "audit", priority: "high" },
    { event: "Tax Filing Deadline", date: "2024-03-15", type: "tax", priority: "critical" },
    { event: "Budget Review", date: "2024-02-28", type: "budget", priority: "medium" }
  ];

  const mockRecentActivities = [
    { action: "Payment processed", amount: 2500, user: "Emma Johnson", timestamp: "1 hour ago" },
    { action: "Invoice generated", amount: 1800, user: "Michael Brown", timestamp: "3 hours ago" },
    { action: "Refund issued", amount: -150, user: "Sarah Davis", timestamp: "5 hours ago" },
    { action: "Payment received", amount: 3200, user: "John Smith", timestamp: "1 day ago" }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section - Financial Health Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(mockFinancialHealthMetrics.totalRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              +{mockFinancialHealthMetrics.monthlyGrowth}% this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(mockFinancialHealthMetrics.outstandingPayments / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockFinancialHealthMetrics.profitMargin}%</div>
            <p className="text-xs text-muted-foreground">Current margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices} paid, {unpaidInvoices} unpaid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              Process Payments
            </Button>
            <Button variant="outline" size="sm">
              <Receipt className="mr-2 h-4 w-4" />
              Generate Invoices
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Run Reports
            </Button>
            <Button variant="outline" size="sm">
              <Calculator className="mr-2 h-4 w-4" />
              Reconcile Accounts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Fee Collection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Fees</span>
              <span className="font-medium">${(mockFeeCollectionStatus.totalFees / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Collected</span>
              <span className="font-medium text-green-600">${(mockFeeCollectionStatus.collected / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Outstanding</span>
              <span className="font-medium text-red-600">${(mockFeeCollectionStatus.outstanding / 1000).toFixed(0)}K</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Collection Rate</span>
                <span className="font-medium">{mockFeeCollectionStatus.collectionRate}%</span>
              </div>
              <Progress value={mockFeeCollectionStatus.collectionRate} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTodaysTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">{transaction.type}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
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
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{payment.student}</p>
                  <p className="text-sm text-muted-foreground">
                    Due: {new Date(payment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${payment.amount.toFixed(2)}</p>
                  <Badge variant={
                    payment.status === "overdue" ? "destructive" : 
                    payment.status === "due-soon" ? "secondary" : "outline"
                  }>
                    {payment.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Expense Summaries */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockExpenseSummaries.map((expense, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium">{expense.category}</p>
                  <p className="text-xs text-muted-foreground">{expense.percentage}% of total</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">${(expense.amount / 1000).toFixed(0)}K</span>
                  <Badge variant={expense.trend === "up" ? "default" : expense.trend === "down" ? "secondary" : "outline"}>
                    {expense.trend === "up" ? "↗" : expense.trend === "down" ? "↘" : "→"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Budget Variance */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Variance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Allocated Budget</span>
              <span className="font-medium">${(mockBudgetVariance.allocated / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Actual Spending</span>
              <span className="font-medium text-red-600">${(mockBudgetVariance.actual / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Variance</span>
              <span className={`font-medium ${mockBudgetVariance.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(mockBudgetVariance.variance / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={mockBudgetVariance.status === "Under Budget" ? "default" : "secondary"}>
                  {mockBudgetVariance.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPaymentTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{trend.month}</p>
                  <p className="text-sm text-muted-foreground">Target: ${(trend.target / 1000).toFixed(0)}K</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(trend.collected / 1000).toFixed(0)}K</p>
                  <Badge variant={trend.trend === "up" ? "default" : "secondary"}>
                    {trend.trend === "up" ? "↗" : "↘"}
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
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{event.event}</p>
                    <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={
                    event.priority === "critical" ? "destructive" : 
                    event.priority === "high" ? "default" : "secondary"
                  }>
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
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
  );
}
