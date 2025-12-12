"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TriangleAlert, Check, ChevronRight, Eye } from "lucide-react"
import Link from "next/link"

const data = [
  {
    name: "Europe",
    stat: "$10,023",
    goalsAchieved: 3,
    status: "observe",
    href: "#",
  },
  {
    name: "North America",
    stat: "$14,092",
    goalsAchieved: 5,
    status: "within",
    href: "#",
  },
  {
    name: "Asia",
    stat: "$113,232",
    goalsAchieved: 1,
    status: "critical",
    href: "#",
  },
]

export default function StatsStatus() {
  return (
    <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
      {data.map((item) => (
        <Card key={item.name} className="p-6 relative">
          <CardContent className="p-0">
            <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
            <p className="text-3xl font-semibold text-foreground">{item.stat}</p>
            <div className="group relative mt-6 flex items-center space-x-4 rounded-md bg-muted/60 p-2 hover:bg-muted">
              <div className="flex w-full items-center justify-between truncate">
                <div className="flex items-center space-x-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded",
                      item.status === "within"
                        ? "bg-emerald-500 text-white"
                        : item.status === "observe"
                          ? "bg-yellow-500 text-white"
                          : "bg-red-500 text-white"
                    )}
                  >
                    {item.status === "within" ? (
                      <Check className="size-4 shrink-0" aria-hidden={true} />
                    ) : item.status === "observe" ? (
                      <Eye className="size-4 shrink-0" aria-hidden={true} />
                    ) : (
                      <TriangleAlert className="size-4 shrink-0" aria-hidden={true} />
                    )}
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      <Link href={item.href} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden={true} />
                        {item.goalsAchieved}/5 goals
                      </Link>
                    </p>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        item.status === "within"
                          ? "text-emerald-700 dark:text-emerald-500"
                          : item.status === "observe"
                            ? "text-yellow-700 dark:text-yellow-500"
                            : "text-red-700 dark:text-red-500"
                      )}
                    >
                      {item.status}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground"
                  aria-hidden={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </dl>
  )
}
