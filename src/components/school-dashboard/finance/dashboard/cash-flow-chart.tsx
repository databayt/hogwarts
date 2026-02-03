"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CashFlowChartProps {
  inflowData: number[]
  outflowData: number[]
  balanceData: number[]
  labels?: string[]
  className?: string
}

export function CashFlowChart({
  inflowData,
  outflowData,
  balanceData,
  labels,
  className,
}: CashFlowChartProps) {
  // Prepare data for the chart
  const chartData = [
    {
      name: "Cash Inflow",
      value: inflowData[0] || 0,
      color: "#10b981",
    },
    {
      name: "Cash Outflow",
      value: outflowData[0] || 0,
      color: "#ef4444",
    },
    {
      name: "Net Cash Flow",
      value: (inflowData[0] || 0) - (outflowData[0] || 0),
      color:
        (inflowData[0] || 0) - (outflowData[0] || 0) >= 0
          ? "#3b82f6"
          : "#f59e0b",
    },
  ]

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-SD", {
      style: "currency",
      currency: "SDG",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value))
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0]
    return (
      <div className="bg-background rounded-lg border p-3 shadow-lg">
        <p className="font-semibold">{data.payload.name}</p>
        <p className="text-sm" style={{ color: data.payload.color }}>
          {formatValue(data.value)}
        </p>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>Cash movement for the current period</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={{ fill: "currentColor", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "currentColor", fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                return value.toString()
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Cash Summary */}
        <div className="mt-6 space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Current Balance
            </span>
            <span className="text-lg font-semibold">
              {formatValue(balanceData[0] || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Net Cash Flow</span>
            <span
              className={`text-lg font-semibold ${
                (inflowData[0] || 0) - (outflowData[0] || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {(inflowData[0] || 0) - (outflowData[0] || 0) >= 0 ? "+" : "-"}
              {formatValue(
                Math.abs((inflowData[0] || 0) - (outflowData[0] || 0))
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
