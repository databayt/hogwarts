"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useEffect, useImperativeHandle } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { InputField, PhoneField } from "@/components/form"
import { SelectField } from "@/components/form/atoms/select"
import { WizardTabs, type WizardTab } from "@/components/form/wizard"

import { useApplySession } from "../application-context"
import { saveGuardianStep } from "./actions"
import { GUARDIAN_RELATION_OPTIONS } from "./config"
import type { GuardianFormProps, GuardianFormRef } from "./types"
import { guardianSchema, type GuardianSchemaType } from "./validation"

export const GuardianForm = forwardRef<GuardianFormRef, GuardianFormProps>(
  ({ initialData, onSuccess, dictionary, onTabChange }, ref) => {
    const { updateStepData } = useApplySession()
    const isRTL =
      (dictionary as Record<string, string> | null)?.locale === "ar" || false

    const tabs: WizardTab[] = [
      { id: "father", label: isRTL ? "الأب" : "Father" },
      { id: "mother", label: isRTL ? "الأم" : "Mother" },
      { id: "guardian", label: isRTL ? "ولي الأمر" : "Guardian" },
    ]

    const form = useForm<GuardianSchemaType>({
      resolver: zodResolver(guardianSchema),
      defaultValues: {
        fatherName: initialData?.fatherName || "",
        fatherOccupation: initialData?.fatherOccupation || "",
        fatherPhone: initialData?.fatherPhone || "",
        fatherEmail: initialData?.fatherEmail || "",
        motherName: initialData?.motherName || "",
        motherOccupation: initialData?.motherOccupation || "",
        motherPhone: initialData?.motherPhone || "",
        motherEmail: initialData?.motherEmail || "",
        guardianName: initialData?.guardianName || "",
        guardianRelation: initialData?.guardianRelation || "",
        guardianPhone: initialData?.guardianPhone || "",
        guardianEmail: initialData?.guardianEmail || "",
      },
    })

    const dict = ((dictionary as Record<string, Record<string, string>> | null)
      ?.apply?.guardian ?? {}) as Record<string, string>

    const prevDataRef = React.useRef<string>("")
    useEffect(() => {
      const subscription = form.watch((value) => {
        const json = JSON.stringify(value)
        if (json !== prevDataRef.current) {
          prevDataRef.current = json
          updateStepData("guardian", value as GuardianSchemaType)
        }
      })
      return () => subscription.unsubscribe()
    }, [form, updateStepData])

    const saveAndNext = async () => {
      const isValid = await form.trigger()
      if (!isValid) throw new Error("Form validation failed")

      const data = form.getValues()
      const result = await saveGuardianStep(data)

      if (!result.success) throw new Error(result.error || "Failed to save")

      if (result.data) {
        updateStepData("guardian", result.data)
      }

      onSuccess?.()
    }

    useImperativeHandle(ref, () => ({ saveAndNext }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <WizardTabs tabs={tabs} onTabChange={onTabChange}>
            {(activeTab) =>
              activeTab === "father" ? (
                <div className="space-y-6">
                  <InputField
                    name="fatherName"
                    label={`${dict.fatherName || "Father's Name"} *`}
                    placeholder={dict.namePlaceholder || "Enter name"}
                  />
                  <InputField
                    name="fatherOccupation"
                    label={dict.occupation || "Occupation"}
                    placeholder={
                      dict.occupationPlaceholder || "Enter occupation"
                    }
                  />
                  <PhoneField
                    name="fatherPhone"
                    label={dict.phone || "Phone"}
                    placeholder="+249 XXX XXX XXXX"
                  />
                  <InputField
                    name="fatherEmail"
                    label={dict.email || "Email"}
                    placeholder="email@example.com"
                    type="email"
                  />
                </div>
              ) : activeTab === "mother" ? (
                <div className="space-y-6">
                  <InputField
                    name="motherName"
                    label={`${dict.motherName || "Mother's Name"} *`}
                    placeholder={dict.namePlaceholder || "Enter name"}
                  />
                  <InputField
                    name="motherOccupation"
                    label={dict.occupation || "Occupation"}
                    placeholder={
                      dict.occupationPlaceholder || "Enter occupation"
                    }
                  />
                  <PhoneField
                    name="motherPhone"
                    label={dict.phone || "Phone"}
                    placeholder="+249 XXX XXX XXXX"
                  />
                  <InputField
                    name="motherEmail"
                    label={dict.email || "Email"}
                    placeholder="email@example.com"
                    type="email"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <InputField
                    name="guardianName"
                    label={dict.guardianName || "Guardian's Name"}
                    placeholder={dict.namePlaceholder || "Enter name"}
                  />
                  <SelectField
                    name="guardianRelation"
                    label={dict.relation || "Relation"}
                    placeholder={dict.selectRelation || "Select relation"}
                    options={GUARDIAN_RELATION_OPTIONS(isRTL).map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                  />
                  <PhoneField
                    name="guardianPhone"
                    label={dict.phone || "Phone"}
                    placeholder="+249 XXX XXX XXXX"
                  />
                  <InputField
                    name="guardianEmail"
                    label={dict.email || "Email"}
                    placeholder="email@example.com"
                    type="email"
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

GuardianForm.displayName = "GuardianForm"
