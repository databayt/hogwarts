"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  IconCurrencyRupee,
  IconReceipt,
  IconClock,
  IconAlertCircle,
  IconUsers,
  IconTrendingUp,
  IconSchool,
  IconRefresh,
} from "@tabler/icons-react";
import type { FeeStats } from "./types";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Props {
  stats: FeeStats;
  dictionary?: Dictionary;
}

export function FeeDashboard({ stats, dictionary }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statsCards = [
    {
      title: "Total Due",
      value: formatCurrency(stats.totalDue),
      icon: IconCurrencyRupee,
      color: "text-blue-500",
    },
    {
      title: "Collected",
      value: formatCurrency(stats.totalCollected),
      icon: IconReceipt,
      color: "text-green-500",
    },
    {
      title: "Pending",
      value: formatCurrency(stats.totalPending),
      icon: IconClock,
      color: "text-yellow-500",
    },
    {
      title: "Overdue",
      value: formatCurrency(stats.totalOverdue),
      icon: IconAlertCircle,
      color: "text-red-500",
    },
    {
      title: "Collection Rate",
      value: `${stats.collectionRate.toFixed(1)}%`,
      icon: IconTrendingUp,
      color: "text-indigo-500",
    },
    {
      title: "Students with Dues",
      value: stats.studentsWithDues.toString(),
      icon: IconUsers,
      color: "text-orange-500",
    },
    {
      title: "Scholarships",
      value: stats.scholarshipsAwarded.toString(),
      icon: IconSchool,
      color: "text-purple-500",
    },
    {
      title: "Refunds",
      value: stats.refundsProcessed.toString(),
      icon: IconRefresh,
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Collection Progress */}
      <Card>
        <CardHeader>
          <CardTitle>
            Collection Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Collected
              </span>
              <span className="text-sm font-medium">
                {formatCurrency(stats.totalCollected)} / {formatCurrency(stats.totalDue)}
              </span>
            </div>
            <Progress value={stats.collectionRate} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Fully Paid Students
              </p>
              <p className="text-2xl font-bold text-green-500">
                {stats.studentsFullyPaid}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Current Month
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.currentMonthCollection)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>
            Fee Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                label: "Paid",
                value: stats.totalCollected,
                color: "bg-green-500",
              },
              {
                label: "Pending",
                value: stats.totalPending,
                color: "bg-yellow-500",
              },
              {
                label: "Overdue",
                value: stats.totalOverdue,
                color: "bg-red-500",
              },
            ].map((item) => {
              const percentage = stats.totalDue > 0
                ? (item.value / stats.totalDue) * 100
                : 0;
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(item.value)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}