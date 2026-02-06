"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

const data = [
  {
    name: "Workspaces",
    capacity: 20,
    current: 1,
    allowed: 5,
    fill: "var(--chart-1)",
  },
  {
    name: "Dashboards",
    capacity: 10,
    current: 2,
    allowed: 20,
    fill: "var(--chart-2)",
  },
  {
    name: "Chart widgets",
    capacity: 30,
    current: 15,
    allowed: 50,
    fill: "var(--chart-3)",
  },
  {
    name: "Storage",
    capacity: 50,
    current: 25,
    allowed: 100,
    fill: "var(--chart-4)",
  },
]

const chartConfig = {
  capacity: {
    label: "Capacity",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function StatsCircular() {
  return (
    <div className="w-full">
      <h2 className="text-foreground text-xl font-medium">Plan overview</h2>
      <p className="text-muted-foreground mt-1 text-sm leading-6">
        You are currently on the{" "}
        <span className="text-foreground font-medium">starter plan</span>.{" "}
        <Link
          href="#"
          className="text-primary inline-flex items-center gap-1 hover:underline hover:underline-offset-4"
        >
          View other plans
          <ExternalLink className="size-4" aria-hidden={true} />
        </Link>
      </p>
      <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((item) => (
          <Card key={item.name} className="p-4">
            <CardContent className="flex items-center gap-4 p-0">
              <div className="relative flex items-center justify-center">
                <ChartContainer
                  config={chartConfig}
                  className="h-[80px] w-[80px]"
                >
                  <RadialBarChart
                    data={[item]}
                    innerRadius={30}
                    outerRadius={60}
                    barSize={6}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                      axisLine={false}
                    />
                    <RadialBar
                      dataKey="capacity"
                      background
                      cornerRadius={10}
                      fill="var(--primary)"
                      angleAxisId={0}
                    />
                  </RadialBarChart>
                </ChartContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-foreground text-base font-medium">
                    {item.capacity}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">
                  {item.name}
                </p>
                <p className="text-muted-foreground text-sm">
                  {item.current} of {item.allowed} used
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </dl>
    </div>
  )
}
