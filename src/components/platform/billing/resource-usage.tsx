"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  GraduationCap,
  Book,
  Database,
} from "lucide-react";
import { USAGE_THRESHOLDS, getUsageSeverity } from "./config";

interface ResourceUsageProps {
  stats: {
    currentUsage: {
      students: number;
      teachers: number;
      classes: number;
      storage: number;
    };
    limits: {
      students: number;
      teachers: number;
      classes: number;
      storage: number;
    };
    usagePercentages: {
      students: number;
      teachers: number;
      classes: number;
      storage: number;
    };
  };
}

export function ResourceUsage({ stats }: ResourceUsageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Usage</CardTitle>
        <CardDescription>Current usage against your plan limits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {[
            { name: "Students", icon: Users, current: stats.currentUsage.students, limit: stats.limits.students, percentage: stats.usagePercentages.students },
            { name: "Teachers", icon: GraduationCap, current: stats.currentUsage.teachers, limit: stats.limits.teachers, percentage: stats.usagePercentages.teachers },
            { name: "Classes", icon: Book, current: stats.currentUsage.classes, limit: stats.limits.classes, percentage: stats.usagePercentages.classes },
            { name: "Storage", icon: Database, current: stats.currentUsage.storage, limit: stats.limits.storage, percentage: stats.usagePercentages.storage, unit: "MB" },
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
                    {resource.current.toLocaleString()} / {resource.limit.toLocaleString()} {(resource as { unit?: string }).unit || ""}
                    <span className="ms-2 font-medium">({resource.percentage}%)</span>
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
  );
}
