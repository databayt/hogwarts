"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Check,
  X,
  Settings,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, SUBSCRIPTION_STATUS } from "./config";
import type { BillingStats, InvoiceWithDetails, PaymentMethodWithUser } from "./types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { ResourceUsage } from "./resource-usage";
import { InvoiceHistory } from "./invoice-history";

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
            <Settings className="me-2 h-4 w-4" />
            Settings
          </Button>
          <Button>
            <ArrowUpRight className="me-2 h-4 w-4" />
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
            <CreditCard className="h-4 w-4 text-muted-foreground" />
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
            <Check className="h-4 w-4 text-green-500" />
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
            <X className="h-4 w-4 text-red-500" />
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
            <AlertCircle className="h-4 w-4 text-orange-500" />
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
      <ResourceUsage stats={stats} />

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
      <InvoiceHistory invoices={invoices} paymentMethods={paymentMethods} />
    </div>
  );
}
