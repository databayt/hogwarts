// @ts-nocheck
"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Bar, BarChart } from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import type { getDictionary } from "@/components/internationalization/dictionaries"

const data = [
  {
    goal: 400,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 239,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 349,
  },
]

const chartConfig = {
  goal: {
    label: "Goal",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface CardsActivityGoalProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function CardsActivityGoal({ dictionary }: CardsActivityGoalProps) {
  const [goal, setGoal] = React.useState(350)

  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)))
  }

  return (
    <Card className="shadow-none border">
      <CardHeader className="pb-4 space-y-1">
        <CardTitle className="text-base font-semibold">
          {dictionary?.cards?.activityGoal?.moveGoal || "Move Goal"}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Set your daily activity goal.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={() => onClick(-10)}
            disabled={goal <= 200}
          >
            <Minus />
            <span className="sr-only">Decrease</span>
          </Button>
          <div className="flex-1 text-center">
            <div className="text-5xl font-bold tracking-tighter">{goal}</div>
            <div className="text-[0.70rem] uppercase text-muted-foreground">
              {dictionary?.cards?.activityGoal?.calories || "Calories"}/day
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={() => onClick(10)}
            disabled={goal >= 400}
          >
            <Plus />
            <span className="sr-only">Increase</span>
          </Button>
        </div>
        <div className="my-3 h-[60px]">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-full w-full"
          >
            <BarChart data={data}>
              <Bar dataKey="goal" radius={4} fill="var(--color-goal)" />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">{dictionary?.cards?.activityGoal?.goal || "Set Goal"}</Button>
      </CardFooter>
    </Card>
  )
}
