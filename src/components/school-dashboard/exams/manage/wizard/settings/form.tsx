"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { CheckboxField, InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardTabs, type WizardTab } from "@/components/form/wizard"
import { PROCTOR_MODE_OPTIONS } from "@/components/school-dashboard/exams/manage/wizard/config"

import { updateExamSettings } from "./actions"
import { settingsSchema, type SettingsFormData } from "./validation"

const TABS: WizardTab[] = [
  { id: "proctoring", label: "Proctoring" },
  { id: "attempts", label: "Attempts" },
]

interface SettingsFormProps {
  examId: string
  initialData?: Partial<SettingsFormData>
  onValidChange?: (isValid: boolean) => void
  onTabChange?: (tabId: string) => void
}

export const SettingsForm = forwardRef<WizardFormRef, SettingsFormProps>(
  ({ examId, initialData, onValidChange, onTabChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<SettingsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(settingsSchema) as any,
      defaultValues: {
        proctorMode: initialData?.proctorMode || "BASIC",
        shuffleQuestions: initialData?.shuffleQuestions ?? true,
        shuffleOptions: initialData?.shuffleOptions ?? true,
        maxAttempts: initialData?.maxAttempts ?? 1,
        retakePenalty: initialData?.retakePenalty,
        allowLateSubmit: initialData?.allowLateSubmit ?? false,
        lateSubmitMinutes: initialData?.lateSubmitMinutes ?? 0,
      },
    })

    // This is an optional step, always valid
    React.useEffect(() => {
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
              const result = await updateExamSettings(examId, data)
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
          <WizardTabs tabs={TABS} onTabChange={onTabChange}>
            {(activeTab) =>
              activeTab === "proctoring" ? (
                <div className="space-y-6">
                  <SelectField
                    name="proctorMode"
                    label="Proctor Mode"
                    options={[...PROCTOR_MODE_OPTIONS]}
                    disabled={isPending}
                  />
                  <CheckboxField
                    name="shuffleQuestions"
                    label="Shuffle Questions"
                    description="Randomize question order for each student"
                    disabled={isPending}
                  />
                  <CheckboxField
                    name="shuffleOptions"
                    label="Shuffle Options"
                    description="Randomize answer options for each student"
                    disabled={isPending}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <InputField
                    name="maxAttempts"
                    label="Max Attempts"
                    type="number"
                    placeholder="1"
                    disabled={isPending}
                  />
                  <InputField
                    name="retakePenalty"
                    label="Retake Penalty (%)"
                    type="number"
                    placeholder="0"
                    disabled={isPending}
                  />
                  <CheckboxField
                    name="allowLateSubmit"
                    label="Allow Late Submission"
                    description="Allow students to submit after the deadline"
                    disabled={isPending}
                  />
                  <InputField
                    name="lateSubmitMinutes"
                    label="Late Submit Grace Period (minutes)"
                    type="number"
                    placeholder="0"
                    disabled={isPending}
                  />
                </div>
              )
            }
          </WizardTabs>
        </form>
      </Form>
    )
  }
)

SettingsForm.displayName = "SettingsForm"
