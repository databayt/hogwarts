"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { InputField, PhoneField } from "@/components/form"
import { createI18nHelpers } from "@/components/internationalization/helpers"

import { useApplySession } from "../application-context"
import type { GuardianStepData } from "../types"
import { getApplyDict } from "../utils"
import { saveGuardianStep } from "./actions"
import type { GuardianFormProps, GuardianFormRef } from "./types"
import {
  createGuardianSchema,
  guardianSchema,
  type GuardianSchemaType,
} from "./validation"

export const GuardianForm = forwardRef<GuardianFormRef, GuardianFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const { updateStepData } = useApplySession()

    const schema = useMemo(() => {
      const messages = (dictionary as Record<string, unknown>)?.messages as
        | Record<string, unknown>
        | undefined
      if (!messages) return guardianSchema
      const { validation } = createI18nHelpers(messages as never)
      return createGuardianSchema(validation)
    }, [dictionary])

    // Determine initial view: show mother if mother has data but father doesn't
    const initialView =
      initialData?.motherName && !initialData?.fatherName ? "mother" : "father"
    const [activeParent, setActiveParent] = useState<"father" | "mother">(
      initialView
    )

    const form = useForm<GuardianSchemaType>({
      resolver: zodResolver(schema),
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

    const dict = getApplyDict(dictionary, "guardian")

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
      if (!isValid) throw new Error("VALIDATION_FAILED")

      const data = form.getValues()
      const result = await saveGuardianStep(data)

      if (!result.success) throw new Error(result.error || "SAVE_FAILED")

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="min-w-0 text-lg font-semibold">
              {isFather ? dict.fatherInfo : dict.motherInfo}
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
              {isFather ? dict.switchToMother : dict.switchToFather}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>

          <div key={activeParent} className="space-y-6">
            <InputField
              name={`${namePrefix}Name`}
              label={isFather ? dict.fatherName : dict.motherName}
              placeholder={dict.namePlaceholder}
            />
            <PhoneField
              name={`${namePrefix}Phone`}
              label={dict.phone}
              placeholder={dict.phonePlaceholder}
              selectCountryLabel={dict.selectCountry}
            />
            <InputField
              name={`${namePrefix}Email`}
              label={dict.email}
              placeholder={dict.emailPlaceholder}
              type="email"
            />
          </div>
        </form>
      </Form>
    )
  }
)

GuardianForm.displayName = "GuardianForm"
