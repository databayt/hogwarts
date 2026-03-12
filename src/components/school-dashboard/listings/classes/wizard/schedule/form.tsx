"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { NumberField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import {
  getClassroomsForClass,
  getPeriodsForClass,
  getTermsForClass,
} from "../actions"
import { updateClassSchedule } from "./actions"
import { scheduleSchema, type ScheduleFormData } from "./validation"

interface ScheduleFormProps {
  classId: string
  initialData?: Partial<ScheduleFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ScheduleForm = forwardRef<WizardFormRef, ScheduleFormProps>(
  ({ classId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [termOptions, setTermOptions] = useState<
      { label: string; value: string }[]
    >([])
    const [periodOptions, setPeriodOptions] = useState<
      { label: string; value: string }[]
    >([])
    const [classroomOptions, setClassroomOptions] = useState<
      { label: string; value: string }[]
    >([])

    const form = useForm<ScheduleFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(scheduleSchema) as any,
      defaultValues: {
        termId: initialData?.termId || "",
        startPeriodId: initialData?.startPeriodId || "",
        endPeriodId: initialData?.endPeriodId || "",
        classroomId: initialData?.classroomId || "",
        duration: initialData?.duration,
      },
    })

    // Load select options
    useEffect(() => {
      const loadOptions = async () => {
        const [terms, periods, classrooms] = await Promise.all([
          getTermsForClass(),
          getPeriodsForClass(),
          getClassroomsForClass(),
        ])
        if (terms.success && terms.data) setTermOptions(terms.data)
        if (periods.success && periods.data) setPeriodOptions(periods.data)
        if (classrooms.success && classrooms.data)
          setClassroomOptions(classrooms.data)
      }
      loadOptions()
    }, [])

    // Notify parent of validity changes
    const termId = form.watch("termId")
    const startPeriodId = form.watch("startPeriodId")
    const endPeriodId = form.watch("endPeriodId")
    const classroomId = form.watch("classroomId")
    useEffect(() => {
      const isValid =
        termId.length >= 1 &&
        startPeriodId.length >= 1 &&
        endPeriodId.length >= 1 &&
        classroomId.length >= 1
      onValidChange?.(isValid)
    }, [termId, startPeriodId, endPeriodId, classroomId, onValidChange])

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
              const result = await updateClassSchedule(classId, data)
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
          <SelectField
            name="termId"
            label="Term"
            options={termOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="startPeriodId"
            label="Start Period"
            options={periodOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="endPeriodId"
            label="End Period"
            options={periodOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="classroomId"
            label="Classroom"
            options={classroomOptions}
            required
            disabled={isPending}
          />
          <NumberField
            name="duration"
            label="Duration (weeks)"
            placeholder="e.g. 16"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

ScheduleForm.displayName = "ScheduleForm"
