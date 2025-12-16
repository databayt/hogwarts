"use client"

import * as React from "react"
import { addMonths, format, isSameDay, startOfMonth, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

import { useAvailableDates } from "../hooks/use-availability"
import type { VisitFormData } from "../validation"

interface DateStepProps {
  schoolId: string
}

export function DateStep({ schoolId }: DateStepProps) {
  const { setValue, watch } = useFormContext<VisitFormData>()
  const selectedDate = watch("date")

  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const { dates, isLoading } = useAvailableDates(schoolId, currentMonth)

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setValue("date", format(date, "yyyy-MM-dd"), { shouldValidate: true })
      // Clear time when date changes
      setValue("startTime", "")
      setValue("endTime", "")
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Determine which dates are disabled
  const disabledDates = React.useMemo(() => {
    const unavailableDates: Date[] = []
    dates.forEach((day) => {
      if (!day.available) {
        unavailableDates.push(new Date(day.date))
      }
    })
    return unavailableDates
  }, [dates])

  // Custom day renderer to show availability
  const modifiers = React.useMemo(() => {
    const available: Date[] = []
    const booked: Date[] = []

    dates.forEach((day) => {
      const date = new Date(day.date)
      if (day.available) {
        available.push(date)
      } else {
        booked.push(date)
      }
    })

    return { available, booked }
  }, [dates])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handlePrevMonth}
          disabled={startOfMonth(currentMonth) <= startOfMonth(new Date())}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Calendar
          mode="single"
          selected={selectedDate ? new Date(selectedDate) : undefined}
          onSelect={handleSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          disabled={(date) =>
            date < new Date() || disabledDates.some((d) => isSameDay(d, date))
          }
          modifiers={modifiers}
          modifiersClassNames={{
            available: "bg-green-50 text-green-700 hover:bg-green-100",
            booked: "text-muted-foreground line-through",
          }}
          className="mx-auto"
        />
      )}

      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted h-3 w-3 rounded-full" />
          <span className="text-muted-foreground">Unavailable</span>
        </div>
      </div>
    </div>
  )
}
