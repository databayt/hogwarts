"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
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
  lang?: Locale
}

const MONTH_NAMES_EN = [
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

const MONTH_NAMES_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
]

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAY_NAMES_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]

export function EventCalendarClient({
  events,
  grouped,
  year,
  month,
  dictionary,
  lang = "en",
}: Props) {
  const isAr = lang === "ar"
  const MONTH_NAMES = isAr ? MONTH_NAMES_AR : MONTH_NAMES_EN
  const DAY_NAMES = isAr ? DAY_NAMES_AR : DAY_NAMES_EN
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
      {/* Calendar */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900 print:rounded-none print:shadow-none">
        {/* Month navigation header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-6 sm:py-4 dark:border-neutral-700 dark:bg-neutral-800">
          <h2 className="text-sm font-medium text-neutral-700 sm:text-base dark:text-neutral-300">
            {d?.calendar?.title || "Event Calendar"}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium text-neutral-700 sm:text-base dark:text-neutral-300">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
          {DAY_NAMES.map((day, idx) => (
            <div
              key={day}
              className={cn(
                "px-2 py-2 text-center text-sm font-medium text-neutral-700 sm:px-4 sm:py-3 sm:text-base dark:text-neutral-300",
                idx < DAY_NAMES.length - 1 &&
                  "border-e border-neutral-200 dark:border-neutral-700"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {/* Group cells into weeks (rows of 7) */}
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, weekIdx) => {
            const weekCells = cells.slice(weekIdx * 7, weekIdx * 7 + 7)
            return (
              <div key={weekIdx} className="grid grid-cols-7">
                {weekCells.map((day, cellIdx) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${weekIdx}-${cellIdx}`}
                        className={cn(
                          "min-h-14 bg-neutral-50 px-2 py-2 sm:min-h-20 sm:px-4 sm:py-3 dark:bg-neutral-800/30",
                          cellIdx < weekCells.length - 1 &&
                            "border-e border-neutral-200 dark:border-neutral-700"
                        )}
                      />
                    )
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
                        "min-h-14 px-2 py-2 text-start transition-all duration-200 hover:shadow-inner sm:min-h-20 sm:px-4 sm:py-3",
                        isToday && "bg-primary/5",
                        isSelected &&
                          "bg-primary/10 ring-primary ring-2 ring-inset",
                        !isToday &&
                          !isSelected &&
                          "bg-white dark:bg-neutral-900",
                        cellIdx < weekCells.length - 1 &&
                          "border-e border-neutral-200 dark:border-neutral-700"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm text-neutral-800 dark:text-neutral-100",
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
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDateKey && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-6 sm:py-4 dark:border-neutral-700 dark:bg-neutral-800">
            <h3 className="text-sm font-medium text-neutral-700 sm:text-base dark:text-neutral-300">
              {new Date(
                year,
                month - 1,
                Number(selectedDay)
              ).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {d?.calendar?.noEvents || "No events on this day."}
              </p>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-neutral-800 dark:text-neutral-100">
                        {evt.title}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {evt.startTime} - {evt.endTime}
                        {evt.location && ` \u00b7 ${evt.location}`}
                      </p>
                    </div>
                    <Badge variant="outline">{evt.eventType}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
