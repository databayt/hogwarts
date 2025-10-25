"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconCreditCard,
  IconReceipt,
  IconTrendingUp,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock,
  IconDownload,
  IconPlus,
  IconSettings,
  IconArrowUpRight,
  IconUsers,
  IconSchool,
  IconBook,
  IconDatabase,
} from "@tabler/icons-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, SUBSCRIPTION_STATUS, USAGE_THRESHOLDS, getUsageSeverity } from "./config";
import type { BillingStats, InvoiceWithDetails, PaymentMethodWithUser } from "./types";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Props {
  stats: BillingStats;
  invoices: InvoiceWithDetails[];
  paymentMethods: PaymentMethodWithUser[];
  dictionary?: Dictionary;
}

export function BillingDashboard({ stats, invoices, paymentMethods, dictionary }: Props) {
  const statusConfig = SUBSCRIPTION_STATUS[stats.planStatus as keyof typeof SUBSCRIPTION_STATUS] || SUBSCRIPTION_STATUS.active;

  return (
    <div className="space-y-6">
      {/* Header with current plan */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <IconSettings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button>
            <IconArrowUpRight className="mr-2 h-4 w-4" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Current Plan Card */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{stats.currentPlan} Plan</CardTitle>
              <CardDescription>
                {stats.nextBillingDate
                  ? `Next billing date: ${new Date(stats.nextBillingDate).toLocaleDateString()}`
                  : "No upcoming billing"
                }
              </CardDescription>
            </div>
            <Badge variant={statusConfig.variant as any} className="text-sm px-3 py-1">
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Next Payment</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.nextPaymentAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Monthly</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.averageMonthlySpend)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalSpent)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {stats.paymentSuccessRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Period</CardTitle>
            <IconCreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.currentPeriodSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successfulPayments}</div>
            <p className="text-xs text-muted-foreground">
              All time successful transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <IconX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedPayments}</div>
            <p className="text-xs text-muted-foreground">
              Payment failures to review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.outstandingBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
          <CardDescription>Current usage against your plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { name: "Students", icon: IconUsers, current: stats.currentUsage.students, limit: stats.limits.students, percentage: stats.usagePercentages.students },
              { name: "Teachers", icon: IconSchool, current: stats.currentUsage.teachers, limit: stats.limits.teachers, percentage: stats.usagePercentages.teachers },
              { name: "Classes", icon: IconBook, current: stats.currentUsage.classes, limit: stats.limits.classes, percentage: stats.usagePercentages.classes },
              { name: "Storage", icon: IconDatabase, current: stats.currentUsage.storage, limit: stats.limits.storage, percentage: stats.usagePercentages.storage, unit: "MB" },
            ].map((resource) => {
              const Icon = resource.icon;
              const severity = getUsageSeverity(resource.percentage);
              const color = severity === "critical" ? "bg-red-500" : severity === "warning" ? "bg-yellow-500" : "bg-green-500";

              return (
                <div key={resource.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{resource.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {resource.current.toLocaleString()} / {resource.limit.toLocaleString()} {resource.unit || ""}
                      <span className="ml-2 font-medium">({resource.percentage}%)</span>
                    </span>
                  </div>
                  <Progress value={resource.percentage} className="h-2">
                    <div className={`h-full ${color} transition-all`} style={{ width: `${resource.percentage}%` }} />
                  </Progress>
                  {resource.percentage >= USAGE_THRESHOLDS.WARNING && (
                    <p className="text-xs text-orange-600">
                      {severity === "critical" ? "⚠️ " : ""}
                      You're approaching your {resource.name.toLowerCase()} limit. Consider upgrading your plan.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Trend</CardTitle>
          <CardDescription>Monthly spending over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlySpending}>
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 100}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Amount
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {formatCurrency(payload[0].value as number)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                strokeWidth={2}
                activeDot={{
                  r: 6,
                  style: { fill: "hsl(var(--primary))" },
                }}
                style={{
                  stroke: "hsl(var(--primary))",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabs for Invoices and Payment Methods */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>Your billing and invoice history</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No invoices yet</p>
                ) : (
                  invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-4">
                        <IconReceipt className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Invoice #{invoice.stripeInvoiceId.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(invoice.amountDue)}</p>
                          <Badge variant={invoice.status === "paid" ? "default" : "outline"} className="mt-1">
                            {invoice.status}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <IconDownload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your payment methods</CardDescription>
                </div>
                <Button size="sm">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Payment Method
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No payment methods added</p>
                ) : (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-4">
                        <IconCreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {method.cardBrand ? `${method.cardBrand.toUpperCase()} •••• ${method.cardLast4}` : method.type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {method.billingName || method.user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && (
                          <Badge>Default</Badge>
                        )}
                        <Button variant="ghost" size="sm">Remove</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
