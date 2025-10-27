import { ICategoryStats } from "./types";
import React from "react";

interface Props {
  categoryData: ICategoryStats;
}

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatTime } from "@/components/kwizi/shared/format-time";

function CategoryBarChart({ categoryData }: Props) {
  const chartData = [
    {
      key: "attempts",
      value: categoryData.attempts,
      fill: "var(--blue-400)",
    },
    {
      key: "completed",
      value: categoryData.completed,
      fill: "var(--green-400)",
    },
  ];

  const chartConfig = {
    attempts: {
      label: "Attempts",
      color: "hsl(var(--chart-1))",
    },
    completed: {
      label: "Completed",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="border-2 shadow-[0_.3rem_0_0_rgba(0,0,0,0.1)]">
      <CardHeader>
        <CardTitle>{categoryData.category?.name}</CardTitle>
        <CardDescription>Attempts vs Completions</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey="key"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="value"
              strokeWidth={2}
              radius={8}
              activeBar={({ ...props }) => {
                return (
                  <Rectangle
                    {...props}
                    fillOpacity={0.8}
                    stroke={props.payload.fill}
                    strokeDasharray={4}
                    strokeDashoffset={4}
                  />
                );
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-semibold text-muted-foreground">
          Attempted on {formatTime(categoryData.lastAttempt)}
        </div>
      </CardFooter>
    </Card>
  );
}

export default CategoryBarChart;
