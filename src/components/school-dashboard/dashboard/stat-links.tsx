"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

const data = [
  {
    name: "Monthly recurring revenue",
    value: "$34.1K",
    change: "+6.1%",
    changeType: "positive",
    href: "#",
  },
  {
    name: "Users",
    value: "500.1K",
    change: "+19.2%",
    changeType: "positive",
    href: "#",
  },
  {
    name: "User growth",
    value: "11.3%",
    change: "-1.2%",
    changeType: "negative",
    href: "#",
  },
]

export default function StatsLinks() {
  return (
    <dl className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => (
        <Card key={item.name} className="gap-0 p-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between space-x-2">
              <span className="text-muted-foreground truncate text-sm">
                {item.name}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  item.changeType === "positive"
                    ? "text-emerald-700 dark:text-emerald-500"
                    : "text-red-700 dark:text-red-500"
                )}
              >
                {item.change}
              </span>
            </div>
            <p className="text-foreground mt-1 text-3xl font-semibold">
              {item.value}
            </p>
          </CardContent>
          <CardFooter className="border-border flex justify-end border-t p-0!">
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
