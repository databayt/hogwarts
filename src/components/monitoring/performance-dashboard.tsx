"use client"

import React, { useEffect, useState } from "react"

import { performanceMonitor } from "@/lib/performance-monitor"

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
  context?: Record<string, any>
}

interface PerformanceSummary {
  metrics: PerformanceMetric[]
  averages: Record<string, number>
  totals: Record<string, number>
}

export function PerformanceDashboard() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(300000) // 5 minutes
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    const updateSummary = () => {
      const newSummary = performanceMonitor.getSummary(selectedTimeWindow)
      setSummary(newSummary)
    }

    updateSummary()

    if (autoRefresh) {
      const interval = setInterval(updateSummary, 10000) // Update every 10 seconds
      return () => clearInterval(interval)
    }
  }, [selectedTimeWindow, autoRefresh])

  const timeWindows = [
    { value: 60000, label: "1 minute" },
    { value: 300000, label: "5 minutes" },
    { value: 900000, label: "15 minutes" },
    { value: 3600000, label: "1 hour" },
  ]

  const formatValue = (value: number, unit: string) => {
    if (unit === "ms" && value > 1000) {
      return `${(value / 1000).toFixed(2)}s`
    }
    return `${value.toFixed(2)}${unit}`
  }

  const getStatusColor = (metricName: string, value: number) => {
    const thresholds: Record<string, { warning: number; critical: number }> = {
      page_load: { warning: 2000, critical: 3000 },
      api_call: { warning: 3000, critical: 5000 },
      db_query: { warning: 500, critical: 1000 },
      web_vital_LCP: { warning: 2500, critical: 4000 },
      web_vital_FID: { warning: 100, critical: 300 },
    }

    for (const [pattern, threshold] of Object.entries(thresholds)) {
      if (metricName.includes(pattern)) {
        if (value >= threshold.critical)
          return "text-destructive bg-destructive/10"
        if (value >= threshold.warning) return "text-chart-4 bg-chart-4/10"
        return "text-chart-2 bg-chart-2/10"
      }
    }

    return "text-muted-foreground bg-muted"
  }

  if (!summary) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-300"></div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-gray-300"></div>
            <div className="h-4 w-5/6 rounded bg-gray-300"></div>
            <div className="h-4 w-4/6 rounded bg-gray-300"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="mb-4">Performance Dashboard</h1>

        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="time-window"
              className="text-sm font-medium text-gray-700"
            >
              Time Window:
            </label>
            <select
              id="time-window"
              value={selectedTimeWindow}
              onChange={(e) => setSelectedTimeWindow(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm"
            >
              {timeWindows.map((window) => (
                <option key={window.value} value={window.value}>
                  {window.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              Auto-refresh
            </label>
          </div>

          <button
            onClick={() => {
              const newSummary =
                performanceMonitor.getSummary(selectedTimeWindow)
              setSummary(newSummary)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="bg-background border-border rounded-lg border p-4">
          <h3 className="mb-2">Total Metrics</h3>
          <p className="text-chart-1 text-3xl font-bold">
            {summary.metrics.length}
          </p>
          <p className="text-muted-foreground text-sm">
            in last{" "}
            {timeWindows.find((w) => w.value === selectedTimeWindow)?.label}
          </p>
        </div>

        <div className="bg-background border-border rounded-lg border p-4">
          <h3 className="mb-2">Metric Types</h3>
          <p className="text-chart-2 text-3xl font-bold">
            {Object.keys(summary.averages).length}
          </p>
          <p className="text-muted-foreground text-sm">
            unique operations tracked
          </p>
        </div>

        <div className="bg-background border-border rounded-lg border p-4">
          <h3 className="mb-2">Avg Response Time</h3>
          <p className="text-chart-3 text-3xl font-bold">
            {Object.values(summary.averages).length > 0
              ? formatValue(
                  Object.values(summary.averages).reduce(
                    (sum, val) => sum + val,
                    0
                  ) / Object.values(summary.averages).length,
                  "ms"
                )
              : "0ms"}
          </p>
          <p className="text-muted-foreground text-sm">across all operations</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2>Performance Averages</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Operation
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Avg Duration
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Count
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Object.entries(summary.averages)
                .sort(([, a], [, b]) => b - a) // Sort by duration descending
                .map(([name, average]) => (
                  <tr key={name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                      {name.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                      {formatValue(average, "ms")}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                      {summary.totals[name] || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(name, average)}`}
                      >
                        {average >= 3000
                          ? "Critical"
                          : average >= 1000
                            ? "Warning"
                            : "Good"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {Object.keys(summary.averages).length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No performance data available for the selected time window.
          </div>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2>Recent Metrics</h2>
        </div>

        <div className="max-h-96 overflow-x-auto overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Operation
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Context
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {summary.metrics
                .slice()
                .reverse() // Show most recent first
                .slice(0, 50) // Limit to 50 most recent
                .map((metric, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                      {metric.name.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                      {formatValue(metric.value, metric.unit)}
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">
                      {metric.context ? JSON.stringify(metric.context) : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
