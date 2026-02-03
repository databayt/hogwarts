"use client"

import { Cell, Pie, PieChart } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

interface UsageItem {
  name: string
  current: string
  limit: string
  percentage: number
  href?: string
}

const usageData: UsageItem[] = [
  { name: "ISR Reads", current: "358K", limit: "1M", percentage: 35.8 },
  { name: "Edge Requests", current: "317K", limit: "1M", percentage: 31.7 },
  {
    name: "Fast Origin Transfer",
    current: "3.07 GB",
    limit: "10 GB",
    percentage: 30.7,
  },
  {
    name: "Speed Insights Data Points",
    current: "791",
    limit: "10K",
    percentage: 7.9,
  },
  {
    name: "Fast Data Transfer",
    current: "4.98 GB",
    limit: "100 GB",
    percentage: 5.0,
  },
  {
    name: "Function Duration",
    current: "3.1 GB-Hrs",
    limit: "100 GB-Hrs",
    percentage: 3.1,
  },
  {
    name: "Web Analytics Events",
    current: "1.3K",
    limit: "50K",
    percentage: 2.6,
  },
  { name: "ISR Writes", current: "4.8K", limit: "200K", percentage: 2.4 },
  {
    name: "Function Invocations",
    current: "19K",
    limit: "1M",
    percentage: 1.9,
  },
  {
    name: "Image Optimization - Cache Reads",
    current: "4.3K",
    limit: "300K",
    percentage: 1.4,
  },
]

const chartConfig = {
  used: {
    label: "Used",
    color: "hsl(var(--primary))",
  },
  remaining: {
    label: "Remaining",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig

function DonutChart({ percentage }: { percentage: number }) {
  const backgroundData = [{ name: "background", value: 100, fill: "#E5E7EB" }]
  const foregroundData = [
    {
      name: "used",
      value: Math.max(0, Math.min(100, Number(percentage))),
      fill: "#3B82F6",
    },
    {
      name: "empty",
      value: 100 - Math.max(0, Math.min(100, Number(percentage))),
      fill: "transparent",
    },
  ]

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square h-6 w-6 shrink-0"
    >
      <PieChart>
        <Pie
          data={backgroundData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={6}
          outerRadius={10}
          isAnimationActive={false}
        >
          {backgroundData.map((entry, index) => (
            <Cell key={`bg-cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Pie
          data={foregroundData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={6}
          outerRadius={10}
          startAngle={90}
          endAngle={-270}
        >
          {foregroundData.map((entry, index) => (
            <Cell key={`fg-cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

export default function StatsUsage() {
  return (
    <Card className="w-full max-w-md gap-3 py-5">
      <CardHeader className="px-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium">Last 30 days</h3>
            <p className="text-muted-foreground text-xs font-medium">
              Updated just now
            </p>
          </div>
          <Button size="sm" className="h-6 text-xs font-medium">
            Upgrade
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-3 pt-0">
        <div className="space-y-0">
          {usageData.map((item, index) => (
            <div
              key={item.name}
              className={`hover:bg-muted/50 flex items-center gap-3 rounded-sm p-2 transition-colors ${
                index % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <DonutChart percentage={item.percentage} />
              <span className="flex-1 truncate text-sm leading-4">
                {item.name}
              </span>
              <span className="text-muted-foreground text-xs font-medium tracking-tighter tabular-nums">
                {item.current} /{" "}
                <span className="text-foreground">{item.limit}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
