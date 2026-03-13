"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardTabs, type WizardTab } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateStudentHealth } from "./actions"
import { healthSchema, type HealthFormData } from "./validation"

interface HealthFormProps {
  studentId: string
  initialData?: Partial<HealthFormData>
  onValidChange?: (isValid: boolean) => void
  onTabChange?: (tabId: string) => void
}

export const HealthForm = forwardRef<WizardFormRef, HealthFormProps>(
  ({ studentId, initialData, onValidChange, onTabChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const { dictionary } = useDictionary()
    const students = (dictionary?.school as any)?.students
    const t = students?.health as Record<string, string> | undefined
    const tRoot = students as Record<string, string> | undefined

    const TABS: WizardTab[] = [
      { id: "medical", label: t?.medicalTab || "Medical" },
      { id: "insurance", label: t?.doctorInsuranceTab || "Doctor & Insurance" },
    ]

    const form = useForm<HealthFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(healthSchema) as any,
      defaultValues: {
        medicalConditions: initialData?.medicalConditions || "",
        allergies: initialData?.allergies || "",
        medicationRequired: initialData?.medicationRequired || "",
        bloodGroup: initialData?.bloodGroup || "",
        doctorName: initialData?.doctorName || "",
        doctorContact: initialData?.doctorContact || "",
        insuranceProvider: initialData?.insuranceProvider || "",
        insuranceNumber: initialData?.insuranceNumber || "",
      },
    })

    // Health step is always valid (all fields optional)
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
                reject(
                  new Error(tRoot?.validationFailed || "Validation failed")
                )
                return
              }
              const data = form.getValues()
              const result = await updateStudentHealth(studentId, data)
              if (!result.success) {
                ErrorToast(
                  result.error || tRoot?.failedToSave || "Failed to save"
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : tRoot?.failedToSave || "Failed to save"
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
              activeTab === "medical" ? (
                <div className="space-y-6">
                  <TextareaField
                    name="medicalConditions"
                    label={t?.medicalConditions || "Medical Conditions"}
                    placeholder={
                      t?.medicalConditionsPlaceholder ||
                      "Enter any medical conditions"
                    }
                    disabled={isPending}
                  />
                  <TextareaField
                    name="allergies"
                    label={t?.allergies || "Allergies"}
                    placeholder={
                      t?.allergiesPlaceholder || "Enter any allergies"
                    }
                    disabled={isPending}
                  />
                  <TextareaField
                    name="medicationRequired"
                    label={t?.medicationRequired || "Medication Required"}
                    placeholder={
                      t?.medicationRequiredPlaceholder ||
                      "Enter any required medication"
                    }
                    disabled={isPending}
                  />
                  <InputField
                    name="bloodGroup"
                    label={t?.bloodGroup || "Blood Group"}
                    placeholder={t?.bloodGroupPlaceholder || "e.g. A+, B-, O+"}
                    disabled={isPending}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <InputField
                    name="doctorName"
                    label={t?.doctorName || "Doctor Name"}
                    placeholder={
                      t?.doctorNamePlaceholder || "Enter doctor's name"
                    }
                    disabled={isPending}
                  />
                  <InputField
                    name="doctorContact"
                    label={t?.doctorContact || "Doctor Contact"}
                    placeholder={
                      t?.doctorContactPlaceholder ||
                      "Enter doctor's contact number"
                    }
                    disabled={isPending}
                  />
                  <InputField
                    name="insuranceProvider"
                    label={t?.insuranceProvider || "Insurance Provider"}
                    placeholder={
                      t?.insuranceProviderPlaceholder ||
                      "Enter insurance provider"
                    }
                    disabled={isPending}
                  />
                  <InputField
                    name="insuranceNumber"
                    label={t?.insuranceNumber || "Insurance Number"}
                    placeholder={
                      t?.insuranceNumberPlaceholder || "Enter insurance number"
                    }
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

HealthForm.displayName = "HealthForm"
