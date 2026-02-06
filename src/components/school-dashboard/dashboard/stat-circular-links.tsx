"use client"

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

const data = [
  {
    name: "HR",
    progress: 25,
    budget: "$1,000",
    current: "$250",
    href: "#",
    fill: "var(--chart-1)",
  },
  {
    name: "Marketing",
    progress: 55,
    budget: "$1,000",
    current: "$550",
    href: "#",
    fill: "var(--chart-2)",
  },
  {
    name: "Finance",
    progress: 85,
    budget: "$1,000",
    current: "$850",
    href: "#",
    fill: "var(--chart-3)",
  },
  {
    name: "Engineering",
    progress: 70,
    budget: "$2,000",
    current: "$1,400",
    href: "#",
    fill: "var(--chart-4)",
  },
]

const chartConfig = {
  progress: {
    label: "Progress",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export default function StatsCircularLinks() {
  return (
    <dl className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((item) => (
        <Card key={item.name} className="gap-0 p-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
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
                      dataKey="progress"
                      background
                      cornerRadius={10}
                      fill={item.fill}
                      angleAxisId={0}
                    />
                  </RadialBarChart>
                </ChartContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-foreground text-base font-medium">
                    {item.progress}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-foreground text-base font-medium">
                  {item.current} / {item.budget}
                </p>
                <p className="text-muted-foreground text-sm">
                  Budget {item.name}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-border flex items-center justify-end border-t p-0!">
            <a
              href={item.href}
              className="text-primary hover:text-primary/90 px-6 py-3 text-sm font-medium"
            >
              View more &#8594;
            </a>
          </CardFooter>
        </Card>
      ))}
    </dl>
  )
}
