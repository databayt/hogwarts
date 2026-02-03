import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

const data = [
  {
    name: "Profit",
    value: "$287,654.00",
    change: "+8.32%",
    changeType: "positive",
  },
  {
    name: "Late payments",
    value: "$9,435.00",
    change: "-12.64%",
    changeType: "negative",
  },
  {
    name: "Pending orders",
    value: "$173,229.00",
    change: "+2.87%",
    changeType: "positive",
  },
  {
    name: "Operating costs",
    value: "$52,891.00",
    change: "-5.73%",
    changeType: "negative",
  },
]

export default function StatsTrending() {
  return (
    <div className="bg-border mx-auto grid grid-cols-1 gap-px rounded-xl sm:grid-cols-2 lg:grid-cols-4">
      {data.map((stat, index) => (
        <Card
          key={stat.name}
          className={cn(
            "rounded-none border-0 py-0 shadow-none",
            index === 0 && "rounded-l-xl",
            index === data.length - 1 && "rounded-r-xl"
          )}
        >
          <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
            <p className="text-muted-foreground text-sm font-medium">
              {stat.name}
            </p>
            <p
              className={cn(
                "text-xs font-medium",
                stat.changeType === "positive"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400"
              )}
            >
              {stat.change}
            </p>
            <p className="text-foreground w-full flex-none text-3xl font-medium tracking-tight">
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
