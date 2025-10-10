"use client";

/**
 * Observability card components for displaying logs and metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { UnifiedLog, LogLevel, MetricValue } from "./types";
import { formatTimestamp, formatRelativeTime, getActionCategory, formatPercentage } from "./util";
import { LOG_LEVEL_VARIANTS, ACTION_CATEGORY_LABELS } from "./config";

/**
 * Log entry card
 */
export function LogCard({ log }: { log: UnifiedLog }) {
  const category = getActionCategory(log.action);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h5>{log.action}</h5>
            <small className="muted">{log.userEmail || log.userId}</small>
          </div>
          {log.level && (
            <Badge variant={LOG_LEVEL_VARIANTS[log.level as LogLevel]}>
              {log.level}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <small className="muted">Category</small>
          <small>{ACTION_CATEGORY_LABELS[category]}</small>
        </div>
        <div className="flex items-center justify-between">
          <small className="muted">Time</small>
          <small>{formatRelativeTime(log.createdAt)}</small>
        </div>
        {log.ip && (
          <div className="flex items-center justify-between">
            <small className="muted">IP</small>
            <small className="font-mono">{log.ip}</small>
          </div>
        )}
        {log.schoolName && (
          <div className="flex items-center justify-between">
            <small className="muted">Tenant</small>
            <small>{log.schoolName}</small>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Metric card with trend indicator
 */
export function MetricCard({
  title,
  metric,
  icon: Icon = Activity,
}: {
  title: string;
  metric: MetricValue;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;
  const trendColor =
    metric.trend === "up" ? "text-green-600" : metric.trend === "down" ? "text-red-600" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>
          <small>{title}</small>
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <h2 className="font-bold">
          {metric.current.toFixed(0)}
          {metric.unit}
        </h2>
        {metric.trend && (
          <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
            <TrendIcon className="size-3" />
            <small>{metric.trend}</small>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * System health status card
 */
export function HealthStatusCard({
  status,
  message,
}: {
  status: "healthy" | "warning" | "critical";
  message: string;
}) {
  const config = {
    healthy: {
      icon: Activity,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/10",
      label: "Healthy",
    },
    warning: {
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/10",
      label: "Warning",
    },
    critical: {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/10",
      label: "Critical",
    },
  };

  const cfg = config[status];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-center gap-3 rounded-lg ${cfg.bg} p-4`}>
      <Icon className={`size-5 ${cfg.color}`} />
      <div>
        <div className={`font-medium ${cfg.color}`}>{cfg.label}</div>
        <small className="muted">{message}</small>
      </div>
    </div>
  );
}
