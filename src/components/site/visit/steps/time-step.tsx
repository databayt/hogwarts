"use client"

import * as React from "react"
import { Clock, Loader2 } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"

import { useAvailableSlots } from "../hooks/use-availability"
import type { VisitFormData } from "../validation"

interface TimeStepProps {
  schoolId: string
}

export function TimeStep({ schoolId }: TimeStepProps) {
  const { setValue, watch } = useFormContext<VisitFormData>()
  const selectedDate = watch("date")
  const selectedTime = watch("startTime")

  const date = selectedDate ? new Date(selectedDate) : null
  const { slots, isLoading, error } = useAvailableSlots(schoolId, date)

  const handleSelect = (startTime: string, endTime: string) => {
    setValue("startTime", startTime, { shouldValidate: true })
    setValue("endTime", endTime)
  }

  if (!selectedDate) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        Please select a date first
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive py-12 text-center">
        Failed to load available times. Please try again.
      </div>
    )
  }

  const availableSlots = slots.filter((slot) => slot.available)
  const unavailableSlots = slots.filter((slot) => !slot.available)

  if (availableSlots.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No available time slots for this date. Please select another date.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-center text-sm">
        Select a time slot for your visit
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {slots.map((slot) => (
          <button
            key={slot.startTime}
            type="button"
            disabled={!slot.available}
            onClick={() => handleSelect(slot.startTime, slot.endTime)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
              slot.available
                ? selectedTime === slot.startTime
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent hover:text-accent-foreground border-input bg-background"
                : "text-muted-foreground border-muted bg-muted/50 cursor-not-allowed"
            )}
          >
            <Clock className="h-4 w-4" />
            <span>{slot.startTime}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary h-3 w-3 rounded-full" />
          <span className="text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="border-input h-3 w-3 rounded-full border" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted h-3 w-3 rounded-full" />
          <span className="text-muted-foreground">Booked</span>
        </div>
      </div>
    </div>
  )
}
