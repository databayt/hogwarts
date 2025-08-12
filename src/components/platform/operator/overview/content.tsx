import React from "react";
import { db } from "@/lib/db";
import { PeriodSwitcher } from "@/components/platform/operator/overview/period-switcher";
import { MetricsCards } from "@/components/platform/operator/overview/metrics-cards";
import { BarGraph } from "@/components/platform/operator/overview/bar-graph";
import { AreaGraph } from "@/components/platform/operator/overview/area-graph";
import { PieGraph } from "@/components/platform/operator/overview/pie-graph";
import { RecentSales } from "@/components/platform/operator/overview/recent-sales";

export async function OverviewContent() {
  const [totalSchools, activeSchools, totalUsers, totalStudents] = await Promise.all([
    db.school.count(),
    db.school.count({ where: { isActive: true } }),
    db.user.count(),
    db.student.count(),
  ]);

  return (
    <div className="flex flex-1 flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
          <PeriodSwitcher />
        </div>
      </div>
      <MetricsCards totals={{ totalSchools, activeSchools, totalUsers, totalStudents }} />
      <BarGraph />
      <RecentSales />
      <div className="flex gap-6 w-full justify-between">
        <AreaGraph />
        <PieGraph />
      </div>

    </div>
  );
}


