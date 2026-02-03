"use client"

import { Calendar, Clock } from "lucide-react"
import { Control } from "react-hook-form"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface SchedulingSectionProps {
  control: Control<any>
  disabled?: boolean
}

export function SchedulingSection({
  control,
  disabled = false,
}: SchedulingSectionProps) {
  // Format datetime-local input value (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return ""
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2">Scheduling Options</h3>
        <p className="text-muted-foreground">
          Schedule when this announcement should be published and when it should
          expire.
        </p>
      </div>

      <FormField
        control={control}
        name="scheduledFor"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule For
            </FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                disabled={disabled}
                value={formatDateTimeLocal(field.value)}
                onChange={(e) => {
                  const value = e.target.value
                  field.onChange(value ? new Date(value).toISOString() : "")
                }}
                min={new Date().toISOString().slice(0, 16)}
              />
            </FormControl>
            <FormDescription>
              Leave empty to publish immediately, or set a future date/time for
              scheduled publishing.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="expiresAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Expires At
            </FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                disabled={disabled}
                value={formatDateTimeLocal(field.value)}
                onChange={(e) => {
                  const value = e.target.value
                  field.onChange(value ? new Date(value).toISOString() : "")
                }}
                min={new Date().toISOString().slice(0, 16)}
              />
            </FormControl>
            <FormDescription>
              Optional: Set when this announcement should automatically be
              unpublished.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
