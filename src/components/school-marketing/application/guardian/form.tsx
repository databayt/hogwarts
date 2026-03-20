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
import { ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { InputField, PhoneField } from "@/components/form"

import { useApplySession } from "../application-context"
import type { GuardianStepData } from "../types"
import { saveGuardianStep } from "./actions"
import type { GuardianFormProps, GuardianFormRef } from "./types"
import { guardianSchema, type GuardianSchemaType } from "./validation"

export const GuardianForm = forwardRef<GuardianFormRef, GuardianFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const { updateStepData } = useApplySession()
    const isRTL =
      (dictionary as Record<string, string> | null)?.locale === "ar" || false

    // Determine initial view: show mother if mother has data but father doesn't
    const initialView =
      initialData?.motherName && !initialData?.fatherName ? "mother" : "father"
    const [activeParent, setActiveParent] = useState<"father" | "mother">(
      initialView
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
          updateStepData("guardian", value as unknown as GuardianStepData)
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
        updateStepData("guardian", result.data as GuardianStepData)
      }

      onSuccess?.()
    }

    useImperativeHandle(ref, () => ({ saveAndNext }))

    const isFather = activeParent === "father"
    const namePrefix = isFather ? "father" : "mother"

    return (
      <Form {...form}>
        <form className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isFather
                ? dict.fatherInfo ||
                  (isRTL ? "معلومات الأب" : "Father's Information")
                : dict.motherInfo ||
                  (isRTL ? "معلومات الأم" : "Mother's Information")}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setActiveParent((p) => (p === "father" ? "mother" : "father"))
              }
              className="text-muted-foreground gap-2"
            >
              {isFather
                ? dict.switchToMother || (isRTL ? "الأم" : "Mother")
                : dict.switchToFather || (isRTL ? "الأب" : "Father")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>

          <InputField
            name={`${namePrefix}Name`}
            label={
              isFather
                ? dict.fatherName || (isRTL ? "اسم الأب" : "Father's Name")
                : dict.motherName || (isRTL ? "اسم الأم" : "Mother's Name")
            }
            placeholder={
              dict.namePlaceholder || (isRTL ? "أدخل الاسم" : "Enter name")
            }
          />
          <InputField
            name={`${namePrefix}Occupation`}
            label={dict.occupation || (isRTL ? "المهنة" : "Occupation")}
            placeholder={
              dict.occupationPlaceholder ||
              (isRTL ? "أدخل المهنة" : "Enter occupation")
            }
          />
          <PhoneField
            name={`${namePrefix}Phone`}
            label={dict.phone || (isRTL ? "الهاتف" : "Phone")}
            placeholder="+249 XXX XXX XXXX"
          />
          <InputField
            name={`${namePrefix}Email`}
            label={dict.email || (isRTL ? "البريد الإلكتروني" : "Email")}
            placeholder="email@example.com"
            type="email"
          />
        </form>
      </Form>
    )
  }
)

GuardianForm.displayName = "GuardianForm"
