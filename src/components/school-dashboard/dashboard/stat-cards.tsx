"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

const data = [
  {
    name: "Unique visitors",
    stat: "10,450",
    change: "-12.5%",
    changeType: "negative",
  },
  {
    name: "Bounce rate",
    stat: "56.1%",
    change: "+1.8%",
    changeType: "positive",
  },
  {
    name: "Visit duration",
    stat: "5.2min",
    change: "+19.7%",
    changeType: "positive",
  },
  {
    name: "Conversion rate",
    stat: "3.2%",
    change: "-2.4%",
    changeType: "negative",
  },
]

export default function StatsCards() {
  return (
    <>
      {data.map((item) => (
        <Card key={item.name} className="p-6 py-4">
          <CardContent className="p-0">
            <p className="text-muted-foreground text-sm font-medium">
              {item.name}
            </p>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="text-foreground text-3xl font-semibold">
                {item.stat}
              </span>
              <span
                className={cn(
                  item.changeType === "positive"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400",
                  "text-sm font-medium"
                )}
              >
                {item.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
