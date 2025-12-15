// @ts-nocheck
"use client"

import { Bar, BarChart, Line, LineChart } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Icons } from "@/components/atom/icons"
import type { getDictionary } from "@/components/internationalization/dictionaries"

const data = [
  {
    revenue: 10400,
    subscription: 240,
  },
  {
    revenue: 14405,
    subscription: 300,
  },
  {
    revenue: 9400,
    subscription: 200,
  },
  {
    revenue: 8200,
    subscription: 278,
  },
  {
    revenue: 7000,
    subscription: 189,
  },
  {
    revenue: 9600,
    subscription: 239,
  },
  {
    revenue: 11244,
    subscription: 278,
  },
  {
    revenue: 26475,
    subscription: 189,
  },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  subscription: {
    label: "Subscriptions",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface CardsStatsProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function CardsStats({ dictionary }: CardsStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 rtl:space-x-reverse">
      <Card className="border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">
            {dictionary?.cards?.stats?.totalRevenue || "Total Revenue"}
          </CardTitle>
          <Icons.dollarSign className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent className="pb-0">
          <div className="text-2xl font-bold">
            {dictionary?.cards?.stats?.revenueAmount || "$15,231.89"}
          </div>
          <p className="text-muted-foreground text-xs">
            {dictionary?.cards?.stats?.revenueGrowth ||
              "+20.1% from last month"}
          </p>
          <ChartContainer config={chartConfig} className="h-[80px] w-full">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="revenue"
                stroke="var(--color-revenue)"
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">
            {dictionary?.cards?.stats?.subscriptions || "Subscriptions"}
          </CardTitle>
          <Icons.users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {dictionary?.cards?.stats?.subscriptionCount || "+2350"}
          </div>
          <p className="text-muted-foreground text-xs">
            {dictionary?.cards?.stats?.subscriptionGrowth ||
              "+180.1% from last month"}
          </p>
          <ChartContainer config={chartConfig} className="mt-2 h-[80px] w-full">
            <BarChart data={data}>
              <Bar
                dataKey="subscription"
                fill="var(--color-subscription)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
