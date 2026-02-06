"use client"

import { TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"

const stats = [
  {
    metric: "Active Users",
    current: "128,456",
    previous: "115,789",
    difference: "10.9%",
    trend: "up",
  },
  {
    metric: "Conversion Rate",
    current: "5.32%",
    previous: "6.18%",
    difference: "0.86%",
    trend: "down",
  },
  {
    metric: "Avg. Session Duration",
    current: "3m 42s",
    previous: "3m 15s",
    difference: "13.8%",
    trend: "up",
  },
]

export default function StatsBorders() {
  return (
    <div className="bg-border divide-border grid grid-cols-1 divide-y overflow-hidden rounded-lg md:grid-cols-3 md:divide-x md:divide-y-0">
      {stats.map((item) => (
        <Card
          key={item.metric}
          className="rounded-none border-0 py-0 shadow-sm"
        >
          <CardContent className="p-4 sm:p-6">
            <CardTitle className="text-base font-normal">
              {item.metric}
            </CardTitle>
            <div className="mt-1 flex items-baseline gap-2 md:block lg:flex">
              <div className="text-primary flex items-baseline text-2xl font-semibold">
                {item.current}
                <span className="text-muted-foreground ms-2 text-sm font-medium">
                  from {item.previous}
                </span>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 ps-2.5 text-xs font-medium md:mt-2 lg:mt-0",
                  item.trend === "up"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {item.trend === "up" ? (
                  <TrendingUp className="-ms-1 me-0.5 h-5 w-5 shrink-0 self-center text-emerald-500" />
                ) : (
                  <TrendingDown className="-ms-1 me-0.5 h-5 w-5 shrink-0 self-center text-red-500" />
                )}

                <span className="sr-only">
                  {" "}
                  {item.trend === "up" ? "Increased" : "Decreased"} by{" "}
                </span>
                {item.difference}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
