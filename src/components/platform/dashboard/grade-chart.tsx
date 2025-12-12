"use client"

import { RadialBar, RadialBarChart } from "recharts"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { GradeDistributionChartProps } from "./types"

const gradeChartConfig = {
  count: { label: "Students" },
  A: { label: "A", color: "hsl(142, 76%, 36%)" },
  B: { label: "B", color: "hsl(199, 89%, 48%)" },
  C: { label: "C", color: "hsl(48, 96%, 53%)" },
  D: { label: "D", color: "hsl(25, 95%, 53%)" },
  F: { label: "F", color: "hsl(0, 84%, 60%)" },
} satisfies ChartConfig

export function GradeDistributionChart({
  data,
  title = "Grade Distribution",
  totalStudents,
  className,
}: GradeDistributionChartProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={gradeChartConfig} className="mx-auto aspect-square max-h-[200px]">
          <RadialBarChart data={data} innerRadius={30} outerRadius={100}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <RadialBar dataKey="count" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {totalStudents && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="text-muted-foreground">Total: {totalStudents} students</div>
        </CardFooter>
      )}
    </Card>
  )
}
