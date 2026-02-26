"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

type CalendarEvent = {
  id: string
  title: string
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  status: string
}

type GroupedEvent = {
  id: string
  title: string
  eventType: string
  startTime: string
  endTime: string
  location: string
}

interface Props {
  events: CalendarEvent[]
  grouped: Record<string, GroupedEvent[]>
  year: number
  month: number
  dictionary: Dictionary["school"]
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function EventCalendarClient({
  events,
  grouped,
  year,
  month,
  dictionary,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedDay = searchParams.get("day")

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()

  const navigateMonth = (delta: number) => {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 1) {
      newMonth = 12
      newYear--
    } else if (newMonth > 12) {
      newMonth = 1
      newYear++
    }
    router.push(`?year=${newYear}&month=${newMonth}`)
  }

  const selectDay = (day: number) => {
    router.push(`?year=${year}&month=${month}&day=${day}`)
  }

  // Build calendar grid
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month

  // Get events for selected day
  const selectedDateKey = selectedDay
    ? `${year}-${String(month).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null
  const selectedDayEvents = selectedDateKey
    ? grouped[selectedDateKey] || []
    : []

  const d = dictionary?.events

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{d?.calendar?.title || "Event Calendar"}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-medium">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="text-muted-foreground p-2 text-center text-sm font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="min-h-[60px] p-1" />
              }

              const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const dayEvents = grouped[dateKey] || []
              const isToday = isCurrentMonth && today.getDate() === day
              const isSelected = selectedDay === String(day)

              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={cn(
                    "hover:bg-muted/50 min-h-[60px] rounded-md p-1 text-start transition-colors",
                    isToday && "bg-primary/5 ring-primary ring-1",
                    isSelected && "bg-primary/10 ring-primary ring-2"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm",
                      isToday && "text-primary font-bold"
                    )}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <div
                          key={evt.id}
                          className="bg-primary h-1.5 w-1.5 rounded-full"
                          title={evt.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-muted-foreground text-[10px]">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day events */}
      {selectedDateKey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {new Date(
                year,
                month - 1,
                Number(selectedDay)
              ).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {d?.calendar?.noEvents || "No events on this day."}
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{evt.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {evt.startTime} - {evt.endTime}
                        {evt.location && ` \u00b7 ${evt.location}`}
                      </p>
                    </div>
                    <Badge variant="outline">{evt.eventType}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
