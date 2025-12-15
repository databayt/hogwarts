"use client"

import { TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ChartAreaInteractiveProps {
  data?: any
}

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Statistics</CardTitle>
        <CardDescription>
          Overview of course enrollments over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted flex h-[300px] items-center justify-center rounded-lg">
          <div className="space-y-2 text-center">
            <TrendingUp className="text-muted-foreground mx-auto size-12" />
            <p className="muted">Chart visualization placeholder</p>
            <p className="text-muted-foreground text-xs">
              TODO: Implement chart with Recharts
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
