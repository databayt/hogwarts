"use client"

import { TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const data = [
  {
    name: "Daily active users",
    stat: "3,450",
    change: "+12.1%",
    changeType: "positive",
  },
  {
    name: "Weekly sessions",
    stat: "1,342",
    change: "-9.8%",
    changeType: "negative",
  },
  {
    name: "Duration",
    stat: "5.2min",
    change: "+7.7%",
    changeType: "positive",
  },
]

export default function StatsBadges() {
  return (
    <dl className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => (
        <Card key={item.name} className="w-full p-6 py-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                {item.name}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 ps-2.5 text-xs font-medium",
                  item.changeType === "positive"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {item.changeType === "positive" ? (
                  <TrendingUp className="-ms-1 me-0.5 h-5 w-5 shrink-0 self-center text-emerald-500" />
                ) : (
                  <TrendingDown className="-ms-1 me-0.5 h-5 w-5 shrink-0 self-center text-red-500" />
                )}
                <span className="sr-only">
                  {" "}
                  {item.changeType === "positive"
                    ? "Increased"
                    : "Decreased"}{" "}
                  by{" "}
                </span>
                {item.change}
              </Badge>
            </div>
            <p className="text-foreground mt-2 text-3xl font-semibold">
              {item.stat}
            </p>
          </CardContent>
        </Card>
      ))}
    </dl>
  )
}
