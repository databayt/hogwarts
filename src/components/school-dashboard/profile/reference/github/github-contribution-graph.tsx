"use client"

import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Map contribution level to color class based on project's color system
const getColorClass = (level: number) => {
  switch (level) {
    case 0:
      return "bg-neutral-100"
    case 1:
      return "bg-emerald-200"
    case 2:
      return "bg-emerald-300"
    case 3:
      return "bg-emerald-500"
    case 4:
      return "bg-emerald-700"
    default:
      return "bg-neutral-100"
  }
}

// Map contribution level to description
const getContributionText = (level: number) => {
  switch (level) {
    case 0:
      return "لا توجد مساهمات"
    case 1:
      return "مساهمة واحدة"
    case 2:
      return "مساهمتان"
    case 3:
      return "3 مساهمات"
    case 4:
      return "4 مساهمات"
    default:
      return "لا توجد مساهمات"
  }
}

export default function GitHubContributionGraph() {
  // Generate a sample contribution data (this would normally come from an API)
  const [contributionData] = useState(() => {
    // Create a 7x52 grid (7 days per week, 52 weeks - full year)
    const weeks = 37
    const days = 7
    const data = Array(days)
      .fill(0)
      .map(() => Array(weeks).fill(0))

    // Fill with random contribution levels (0-4)
    for (let day = 0; day < days; day++) {
      for (let week = 0; week < weeks; week++) {
        // Higher probability for empty cells
        const rand = Math.random()
        if (rand < 0.75)
          data[day][week] = 0 // 75% chance of no contributions (up from 50%)
        else if (rand < 0.88)
          data[day][week] = 1 // 13% chance of level 1 (down from 20%)
        else if (rand < 0.95)
          data[day][week] = 2 // 7% chance of level 2 (down from 15%)
        else if (rand < 0.98)
          data[day][week] = 3 // 3% chance of level 3 (down from 10%)
        else data[day][week] = 4 // 2% chance of level 4 (down from 5%)
      }
    }

    return data
  })

  // Calculate total contributions
  const totalContributions = 141 // Fixed value around 140

  // Generate a sample date for tooltip
  const getDateText = (week: number, day: number) => {
    const date = new Date()
    date.setDate(date.getDate() - ((51 - week) * 7 + (6 - day)))
    return date.toLocaleDateString("ar-SA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className="w-full p-0">
      <CardContent className="p-0">
        <h6 className="mb-8 text-right text-base font-medium" dir="rtl">
          {totalContributions} مساهمة في العام الماضي
        </h6>
        <TooltipProvider>
          <div>
            <div className="flex min-w-max flex-wrap justify-start gap-1">
              {contributionData[0].map((_, week) => (
                <div key={week} className="flex flex-col gap-1">
                  {contributionData.map((_, day) => (
                    <Tooltip key={`${week}-${day}`} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-3 w-3 rounded-sm ${getColorClass(contributionData[day][week])}`}
                          aria-label={`${getContributionText(contributionData[day][week])} في ${getDateText(week, day)}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>
                          {getContributionText(contributionData[day][week])}
                        </p>
                        <p className="text-muted-foreground">
                          {getDateText(week, day)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>

        <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
          <button className="text-muted-foreground text-xs hover:text-blue-600">
            تعرّف على كيفية حساب المساهمات
          </button>
          <div className="flex items-center" dir="rtl">
            <span className="ml-2">أقل</span>
            <div className="flex gap-1">
              <div className="h-3 w-3 rounded-sm bg-neutral-100" />
              <div className="h-3 w-3 rounded-sm bg-emerald-200" />
              <div className="h-3 w-3 rounded-sm bg-emerald-400" />
              <div className="h-3 w-3 rounded-sm bg-emerald-600" />
              <div className="h-3 w-3 rounded-sm bg-emerald-800" />
            </div>
            <span className="mr-2">أكثر</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
