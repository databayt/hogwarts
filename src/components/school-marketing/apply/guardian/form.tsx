"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { InputField, PhoneField } from "@/components/form"

import { useApplySession } from "../application-context"
import { saveGuardianStep } from "./actions"
import type { GuardianFormProps, GuardianFormRef } from "./types"
import { guardianSchema, type GuardianSchemaType } from "./validation"

export const GuardianForm = forwardRef<GuardianFormRef, GuardianFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const { updateStepData } = useApplySession()
    const isRTL =
      (dictionary as Record<string, string> | null)?.locale === "ar" || false

    const [showMother, setShowMother] = useState(
      !!(
        initialData?.motherName ||
        initialData?.motherPhone ||
        initialData?.motherEmail ||
        initialData?.motherOccupation
      )
    )

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
          <InputField
            name="fatherName"
            label={`${dict.fatherName || (isRTL ? "اسم الأب" : "Father's Name")} *`}
            placeholder={
              dict.namePlaceholder || (isRTL ? "أدخل الاسم" : "Enter name")
            }
          />
          <InputField
            name="fatherOccupation"
            label={dict.occupation || (isRTL ? "المهنة" : "Occupation")}
            placeholder={
              dict.occupationPlaceholder ||
              (isRTL ? "أدخل المهنة" : "Enter occupation")
            }
          />
          <PhoneField
            name="fatherPhone"
            label={dict.phone || (isRTL ? "الهاتف" : "Phone")}
            placeholder="+249 XXX XXX XXXX"
          />
          <InputField
            name="fatherEmail"
            label={dict.email || (isRTL ? "البريد الإلكتروني" : "Email")}
            placeholder="email@example.com"
            type="email"
          />

          <button
            type="button"
            onClick={() => setShowMother(!showMother)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
          >
            {showMother ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            {isRTL
              ? "معلومات الأم (اختياري)"
              : "Mother's Information (optional)"}
          </button>

          {showMother && (
            <div className="space-y-6">
              <InputField
                name="motherName"
                label={
                  dict.motherName || (isRTL ? "اسم الأم" : "Mother's Name")
                }
                placeholder={
                  dict.namePlaceholder || (isRTL ? "أدخل الاسم" : "Enter name")
                }
              />
              <InputField
                name="motherOccupation"
                label={dict.occupation || (isRTL ? "المهنة" : "Occupation")}
                placeholder={
                  dict.occupationPlaceholder ||
                  (isRTL ? "أدخل المهنة" : "Enter occupation")
                }
              />
              <PhoneField
                name="motherPhone"
                label={dict.phone || (isRTL ? "الهاتف" : "Phone")}
                placeholder="+249 XXX XXX XXXX"
              />
              <InputField
                name="motherEmail"
                label={dict.email || (isRTL ? "البريد الإلكتروني" : "Email")}
                placeholder="email@example.com"
                type="email"
              />
            </div>
          )}
        </form>
      </Form>
    )
  }
)

GuardianForm.displayName = "GuardianForm"
