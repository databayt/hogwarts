"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, PhoneField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { saveStudentPersonalGuardians } from "./actions"
import {
  createPersonalGuardianSchema,
  type PersonalGuardianFormData,
} from "./validation"

interface GuardianFormProps {
  studentId: string
  initialData?: Partial<PersonalGuardianFormData>
  onValidChange?: (isValid: boolean) => void
  // When provided, only that parent's fields are shown. The form still holds
  // both parents' state so saveAndNext can persist both in one transaction.
  controlledParent: "father" | "mother"
}

export const GuardianForm = forwardRef<WizardFormRef, GuardianFormProps>(
  ({ studentId, initialData, onValidChange, controlledParent }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const students = (dictionary?.school as Record<string, unknown>)
      ?.students as Record<string, unknown> | undefined
    const t = students?.guardian as Record<string, string> | undefined
    const tContact = students?.contact as Record<string, string> | undefined
    const tRoot = students as Record<string, string> | undefined

    const schema = useMemo(
      () => createPersonalGuardianSchema(t?.atLeastOneParent),
      [t?.atLeastOneParent]
    )

    const form = useForm({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        fatherName: initialData?.fatherName || "",
        fatherPhone: initialData?.fatherPhone || "",
        fatherWhatsapp: initialData?.fatherWhatsapp || "",
        motherName: initialData?.motherName || "",
        motherPhone: initialData?.motherPhone || "",
        motherWhatsapp: initialData?.motherWhatsapp || "",
      },
    })

    // Auto-fill whatsapp from phone for the active parent.
    const fatherPhone = form.watch("fatherPhone")
    const motherPhone = form.watch("motherPhone")
    useEffect(() => {
      const wa = form.getValues("fatherWhatsapp")
      if (!wa && fatherPhone) form.setValue("fatherWhatsapp", fatherPhone)
    }, [fatherPhone, form])
    useEffect(() => {
      const wa = form.getValues("motherWhatsapp")
      if (!wa && motherPhone) form.setValue("motherWhatsapp", motherPhone)
    }, [motherPhone, form])

    // Guardian validity: at-least-one parent name present.
    const fatherName = form.watch("fatherName")
    const motherName = form.watch("motherName")
    React.useEffect(() => {
      const isValid =
        (fatherName as string)?.trim().length > 0 ||
        (motherName as string)?.trim().length > 0
      onValidChange?.(isValid)
    }, [fatherName, motherName, onValidChange])

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
              const result = await saveStudentPersonalGuardians(
                studentId,
                data as PersonalGuardianFormData
              )
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

    const isFather = controlledParent === "father"
    const namePrefix = isFather ? "father" : "mother"

    return (
      <Form {...form}>
        <form className="space-y-6">
          <InputField
            name={`${namePrefix}Name`}
            label={
              isFather
                ? t?.fatherName || "Father's Name"
                : t?.motherName || "Mother's Name"
            }
            placeholder={t?.namePlaceholder || "Enter full name"}
            disabled={isPending}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-7">
            <PhoneField
              name={`${namePrefix}Phone`}
              label={t?.phone || tContact?.phone || "Phone"}
              placeholder={
                t?.phonePlaceholder ||
                tContact?.phonePlaceholder ||
                "Enter phone number"
              }
              disabled={isPending}
            />
            <PhoneField
              name={`${namePrefix}Whatsapp`}
              label={tContact?.whatsapp || "WhatsApp"}
              placeholder={
                t?.phonePlaceholder ||
                tContact?.phonePlaceholder ||
                "Enter phone number"
              }
              disabled={isPending}
            />
          </div>
        </form>
      </Form>
    )
  }
)

GuardianForm.displayName = "GuardianForm"
