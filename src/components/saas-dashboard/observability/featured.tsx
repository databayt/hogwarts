"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Featured logs and metrics lab
 */
import { Activity, AlertTriangle, Clock } from "lucide-react"

import { HealthStatusCard, LogCard, MetricCard } from "./card"
import type { MetricValue, UnifiedLog } from "./types"
import { formatRelativeTime } from "./util"

interface FeaturedLogsProps {
  logs: UnifiedLog[]
  maxItems?: number
  dictionary?: any
}

export function FeaturedLogs({
  logs,
  maxItems = 10,
  dictionary,
}: FeaturedLogsProps) {
  const f = dictionary?.operator?.observability?.featured
  const recentLogs = logs.slice(0, maxItems)

  return (
    <div className="space-y-4">
      <h4>{f?.recentActivity || "Recent Activity"}</h4>
      <div className="space-y-2">
        {recentLogs.map((log) => (
          <LogCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  )
}

export function ErrorLogs({
  logs,
  dictionary,
}: {
  logs: UnifiedLog[]
  dictionary?: any
}) {
  const f = dictionary?.operator?.observability?.featured
  const errorLogs = logs.filter((log) => log.level === "error").slice(0, 5)

  if (errorLogs.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-500/10">
          <Activity className="size-6 text-green-600" />
        </div>
        <h5 className="mt-4">{f?.noErrors || "No errors"}</h5>
        <p className="muted mt-2">
          {f?.systemRunning || "System running smoothly"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-5 text-red-600" />
        <h4>{f?.recentErrors || "Recent Errors"}</h4>
        <span className="rounded-full bg-red-500/10 px-2 py-1">
          <small className="text-red-600">{errorLogs.length}</small>
        </span>
      </div>
      <div className="space-y-2">
        {errorLogs.map((log) => (
          <div
            key={log.id}
            className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:bg-red-950/10"
          >
            <div className="flex items-start justify-between">
              <div>
                <h6>{log.action}</h6>
                <small className="muted">{log.userEmail || log.userId}</small>
              </div>
              <small className="muted">
                {formatRelativeTime(log.createdAt)}
              </small>
            </div>
            {log.reason && (
              <p className="muted mt-2 line-clamp-2">{log.reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MetricsOverview({
  metrics,
  dictionary,
}: {
  metrics: {
    cpu: MetricValue
    memory: MetricValue
    requests: MetricValue
  }
  dictionary?: any
}) {
  const f = dictionary?.operator?.observability?.featured
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title={f?.cpuUsage || "CPU Usage"}
        metric={metrics.cpu}
        icon={Activity}
      />
      <MetricCard
        title={f?.memory || "Memory"}
        metric={metrics.memory}
        icon={Activity}
      />
      <MetricCard
        title={f?.requestsPerMin || "Requests/min"}
        metric={metrics.requests}
        icon={Clock}
      />
    </div>
  )
}

export function ObservabilityDashboard({
  logs,
  dictionary,
}: {
  logs: UnifiedLog[]
  dictionary?: any
}) {
  const f = dictionary?.operator?.observability?.featured
  return (
    <div className="space-y-6">
      <HealthStatusCard
        status="healthy"
        message={f?.allOperational || "All systems operational"}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <FeaturedLogs logs={logs} dictionary={dictionary} />
        <ErrorLogs logs={logs} dictionary={dictionary} />
      </div>
    </div>
  )
}
