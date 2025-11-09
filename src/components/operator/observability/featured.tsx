"use client";

/**
 * Featured logs and metrics lab
 */

import { LogCard, MetricCard, HealthStatusCard } from "./card";
import { Activity, AlertTriangle, Clock } from "lucide-react";
import type { UnifiedLog, MetricValue } from "./types";
import { formatRelativeTime } from "./util";

interface FeaturedLogsProps {
  logs: UnifiedLog[];
  maxItems?: number;
}

export function FeaturedLogs({ logs, maxItems = 10 }: FeaturedLogsProps) {
  const recentLogs = logs.slice(0, maxItems);

  return (
    <div className="space-y-4">
      <h4>Recent Activity</h4>
      <div className="space-y-2">
        {recentLogs.map((log) => (
          <LogCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}

export function ErrorLogs({ logs }: { logs: UnifiedLog[] }) {
  const errorLogs = logs.filter((log) => log.level === "error").slice(0, 5);

  if (errorLogs.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10 mx-auto">
          <Activity className="size-6 text-green-600" />
        </div>
        <h5 className="mt-4">No errors</h5>
        <p className="muted mt-2">System running smoothly</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-5 text-red-600" />
        <h4>Recent Errors</h4>
        <span className="rounded-full bg-red-500/10 px-2 py-1">
          <small className="text-red-600">{errorLogs.length}</small>
        </span>
      </div>
      <div className="space-y-2">
        {errorLogs.map((log) => (
          <div key={log.id} className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/10 p-3">
            <div className="flex items-start justify-between">
              <div>
                <h6>{log.action}</h6>
                <small className="muted">{log.userEmail || log.userId}</small>
              </div>
              <small className="muted">{formatRelativeTime(log.createdAt)}</small>
            </div>
            {log.reason && <p className="muted mt-2 line-clamp-2">{log.reason}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricsOverview({
  metrics,
}: {
  metrics: {
    cpu: MetricValue;
    memory: MetricValue;
    requests: MetricValue;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard title="CPU Usage" metric={metrics.cpu} icon={Activity} />
      <MetricCard title="Memory" metric={metrics.memory} icon={Activity} />
      <MetricCard title="Requests/min" metric={metrics.requests} icon={Clock} />
    </div>
  );
}

export function ObservabilityDashboard({ logs }: { logs: UnifiedLog[] }) {
  return (
    <div className="space-y-6">
      <HealthStatusCard
        status="healthy"
        message="All systems operational"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <FeaturedLogs logs={logs} />
        <ErrorLogs logs={logs} />
      </div>
    </div>
  );
}
