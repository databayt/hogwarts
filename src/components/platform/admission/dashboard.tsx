"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  IconUsers,
  IconUserCheck,
  IconClock,
  IconCheck,
  IconX,
  IconList,
  IconSchool,
  IconTrendingUp,
} from "@tabler/icons-react";
import type { AdmissionStats } from "./types";

interface Props {
  stats: AdmissionStats;
  
}

export function AdmissionDashboard({ stats }: Props) {
  const conversionRate = stats.totalApplications > 0
    ? ((stats.admitted / stats.totalApplications) * 100).toFixed(1)
    : "0";

  const seatUtilization = (stats.seatsFilled + stats.seatsAvailable) > 0
    ? ((stats.seatsFilled / (stats.seatsFilled + stats.seatsAvailable)) * 100)
    : 0;

  const statsCards = [
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: IconUsers,
      color: "text-blue-500",
    },
    {
      title: "Submitted",
      value: stats.submitted,
      icon: IconUserCheck,
      color: "text-green-500",
    },
    {
      title: "Under Review",
      value: stats.underReview,
      icon: IconClock,
      color: "text-yellow-500",
    },
    {
      title: "Selected",
      value: stats.selected,
      icon: IconCheck,
      color: "text-emerald-500",
    },
    {
      title: "Waitlisted",
      value: stats.waitlisted,
      icon: IconList,
      color: "text-orange-500",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: IconX,
      color: "text-red-500",
    },
    {
      title: "Admitted",
      value: stats.admitted,
      icon: IconSchool,
      color: "text-purple-500",
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: IconTrendingUp,
      color: "text-indigo-500",
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

      {/* Seat Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>
            {"Seat Utilization"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {"Seats Filled"}
              </p>
              <p className="text-2xl font-bold">
                {stats.seatsFilled} / {stats.seatsFilled + stats.seatsAvailable}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {"Available"}
              </p>
              <p className="text-2xl font-bold text-green-500">
                {stats.seatsAvailable}
              </p>
            </div>
          </div>
          <Progress value={seatUtilization} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {seatUtilization.toFixed(1)}% {"utilized"}
          </p>
        </CardContent>
      </Card>

      {/* Application Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>
            {"Application Pipeline"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Submitted", value: stats.submitted, color: "bg-blue-500" },
              { label: "Under Review", value: stats.underReview, color: "bg-yellow-500" },
              { label: "Selected", value: stats.selected, color: "bg-green-500" },
              { label: "Waitlisted", value: stats.waitlisted, color: "bg-orange-500" },
              { label: "Admitted", value: stats.admitted, color: "bg-purple-500" },
            ].map((stage) => {
              const percentage = stats.totalApplications > 0
                ? (stage.value / stats.totalApplications) * 100
                : 0;
              return (
                <div key={stage.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stage.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {stage.value} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} transition-all duration-300`}
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