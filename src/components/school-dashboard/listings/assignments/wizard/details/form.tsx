"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { DateField, InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { completeAssignmentWizard } from "../actions"
import { updateAssignmentDetails } from "./actions"
import { detailsSchema, type DetailsFormData } from "./validation"

interface DetailsFormProps {
  assignmentId: string
  initialData?: Partial<DetailsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const DetailsForm = forwardRef<WizardFormRef, DetailsFormProps>(
  ({ assignmentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const form = useForm<DetailsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(detailsSchema) as any,
      defaultValues: {
        totalPoints: initialData?.totalPoints ?? 100,
        weight: initialData?.weight ?? 10,
        dueDate: initialData?.dueDate,
        instructions: initialData?.instructions || "",
      },
    })

    // Notify parent of validity changes
    const totalPoints = form.watch("totalPoints")
    const weight = form.watch("weight")
    const dueDate = form.watch("dueDate")
    React.useEffect(() => {
      const isValid =
        totalPoints > 0 && weight > 0 && weight <= 100 && !!dueDate
      onValidChange?.(isValid)
    }, [totalPoints, weight, dueDate, onValidChange])

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

              // Save details
              const saveResult = await updateAssignmentDetails(
                assignmentId,
                data
              )
              if (!saveResult.success) {
                ErrorToast(saveResult.error || "Failed to save")
                reject(new Error(saveResult.error))
                return
              }

              // Complete the wizard
              const completeResult =
                await completeAssignmentWizard(assignmentId)
              if (!completeResult.success) {
                ErrorToast(completeResult.error || "Failed to complete")
                reject(new Error(completeResult.error))
                return
              }

              // Redirect to assignments list
              router.push("/assignments")
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
          <InputField
            name="totalPoints"
            label="Total Points"
            type="number"
            placeholder="100"
            required
            disabled={isPending}
          />
          <InputField
            name="weight"
            label="Weight (%)"
            type="number"
            placeholder="10"
            required
            disabled={isPending}
          />
          <DateField
            name="dueDate"
            label="Due Date"
            required
            disabled={isPending}
          />
          <TextareaField
            name="instructions"
            label="Instructions"
            placeholder="Enter assignment instructions"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

DetailsForm.displayName = "DetailsForm"
