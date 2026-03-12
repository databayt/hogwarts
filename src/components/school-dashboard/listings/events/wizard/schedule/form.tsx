"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { DateField, InputField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateEventSchedule } from "./actions"
import { scheduleSchema, type ScheduleFormData } from "./validation"

interface ScheduleFormProps {
  eventId: string
  initialData?: Partial<ScheduleFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ScheduleForm = forwardRef<WizardFormRef, ScheduleFormProps>(
  ({ eventId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ScheduleFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(scheduleSchema) as any,
      defaultValues: {
        eventDate: initialData?.eventDate,
        startTime: initialData?.startTime || "09:00",
        endTime: initialData?.endTime || "10:00",
        location: initialData?.location || "",
      },
    })

    // Notify parent of validity changes
    const eventDate = form.watch("eventDate")
    const startTime = form.watch("startTime")
    const endTime = form.watch("endTime")
    React.useEffect(() => {
      const isValid =
        !!eventDate && startTime.length >= 1 && endTime.length >= 1
      onValidChange?.(isValid)
    }, [eventDate, startTime, endTime, onValidChange])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const valid = await form.trigger()
              if (!valid) {
                reject(new Error("Validation failed"))
                return
              }
              const data = form.getValues()
              const result = await updateEventSchedule(eventId, data)
              if (!result.success) {
                ErrorToast(result.error || "Failed to save")
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <DateField
            name="eventDate"
            label="Event Date"
            required
            disabled={isPending}
          />
          <InputField
            name="startTime"
            label="Start Time"
            type="time"
            required
            disabled={isPending}
          />
          <InputField
            name="endTime"
            label="End Time"
            type="time"
            required
            disabled={isPending}
          />
          <InputField
            name="location"
            label="Location"
            placeholder="Enter event location"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

ScheduleForm.displayName = "ScheduleForm"
