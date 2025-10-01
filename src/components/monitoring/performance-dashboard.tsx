'use client';

import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  context?: Record<string, any>;
}

interface PerformanceSummary {
  metrics: PerformanceMetric[];
  averages: Record<string, number>;
  totals: Record<string, number>;
}

export function PerformanceDashboard() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(300000); // 5 minutes
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateSummary = () => {
      const newSummary = performanceMonitor.getSummary(selectedTimeWindow);
      setSummary(newSummary);
    };

    updateSummary();

    if (autoRefresh) {
      const interval = setInterval(updateSummary, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeWindow, autoRefresh]);

  const timeWindows = [
    { value: 60000, label: '1 minute' },
    { value: 300000, label: '5 minutes' },
    { value: 900000, label: '15 minutes' },
    { value: 3600000, label: '1 hour' },
  ];

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms' && value > 1000) {
      return `${(value / 1000).toFixed(2)}s`;
    }
    return `${value.toFixed(2)}${unit}`;
  };

  const getStatusColor = (metricName: string, value: number) => {
    const thresholds: Record<string, { warning: number; critical: number }> = {
      page_load: { warning: 2000, critical: 3000 },
      api_call: { warning: 3000, critical: 5000 },
      db_query: { warning: 500, critical: 1000 },
      web_vital_LCP: { warning: 2500, critical: 4000 },
      web_vital_FID: { warning: 100, critical: 300 },
    };

    for (const [pattern, threshold] of Object.entries(thresholds)) {
      if (metricName.includes(pattern)) {
        if (value >= threshold.critical) return 'text-red-600 bg-red-50';
        if (value >= threshold.warning) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
      }
    }

    return 'text-gray-600 bg-gray-50';
  };

  if (!summary) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="mb-4">Performance Dashboard</h1>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="time-window" className="text-sm font-medium text-gray-700">
              Time Window:
            </label>
            <select
              id="time-window"
              value={selectedTimeWindow}
              onChange={(e) => setSelectedTimeWindow(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
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
              const newSummary = performanceMonitor.getSummary(selectedTimeWindow);
              setSummary(newSummary);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="mb-2">Total Metrics</h3>
          <p className="text-3xl font-bold text-blue-600">
            {summary.metrics.length}
          </p>
          <p className="text-sm text-muted-foreground">
            in last {timeWindows.find(w => w.value === selectedTimeWindow)?.label}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="mb-2">Metric Types</h3>
          <p className="text-3xl font-bold text-green-600">
            {Object.keys(summary.averages).length}
          </p>
          <p className="text-sm text-muted-foreground">unique operations tracked</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="mb-2">Avg Response Time</h3>
          <p className="text-3xl font-bold text-purple-600">
            {Object.values(summary.averages).length > 0
              ? formatValue(
                  Object.values(summary.averages).reduce((sum, val) => sum + val, 0) / Object.values(summary.averages).length,
                  'ms'
                )
              : '0ms'}
          </p>
          <p className="text-sm text-muted-foreground">across all operations</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2>Performance Averages</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(summary.averages)
                .sort(([, a], [, b]) => b - a) // Sort by duration descending
                .map(([name, average]) => (
                  <tr key={name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {name.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatValue(average, 'ms')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {summary.totals[name] || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(name, average)}`}>
                        {average >= 3000 ? 'Critical' : average >= 1000 ? 'Warning' : 'Good'}
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

      <div className="mt-8 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2>Recent Metrics</h2>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Context
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.metrics
                .slice()
                .reverse() // Show most recent first
                .slice(0, 50) // Limit to 50 most recent
                .map((metric, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.name.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatValue(metric.value, metric.unit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {metric.context ? JSON.stringify(metric.context) : '-'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}