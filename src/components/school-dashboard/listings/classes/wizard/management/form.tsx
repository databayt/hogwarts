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

import { getClassesForPrerequisite } from "../actions"
import { updateClassManagement } from "./actions"
import { managementSchema, type ManagementFormData } from "./validation"

interface ManagementFormProps {
  classId: string
  initialData?: Partial<ManagementFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ManagementForm = forwardRef<WizardFormRef, ManagementFormProps>(
  ({ classId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [prerequisiteOptions, setPrerequisiteOptions] = useState<
      { label: string; value: string }[]
    >([])

    const form = useForm<ManagementFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(managementSchema) as any,
      defaultValues: {
        credits: initialData?.credits,
        minCapacity: initialData?.minCapacity,
        maxCapacity: initialData?.maxCapacity,
        prerequisiteId: initialData?.prerequisiteId,
      },
    })

    // Load prerequisite options
    useEffect(() => {
      const loadOptions = async () => {
        const result = await getClassesForPrerequisite(classId)
        if (result.success && result.data) setPrerequisiteOptions(result.data)
      }
      loadOptions()
    }, [classId])

    // Management is optional, always valid
    useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

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
              const result = await updateClassManagement(classId, data)
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
          <NumberField
            name="credits"
            label="Credits"
            placeholder="e.g. 3.00"
            disabled={isPending}
          />
          <NumberField
            name="minCapacity"
            label="Minimum Capacity"
            placeholder="e.g. 10"
            disabled={isPending}
          />
          <NumberField
            name="maxCapacity"
            label="Maximum Capacity"
            placeholder="e.g. 50"
            disabled={isPending}
          />
          <SelectField
            name="prerequisiteId"
            label="Prerequisite Class"
            options={prerequisiteOptions}
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

ManagementForm.displayName = "ManagementForm"
