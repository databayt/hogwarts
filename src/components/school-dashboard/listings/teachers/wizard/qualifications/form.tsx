"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Award,
  FileText,
  FolderOpen,
  GraduationCap,
  IdCard,
  ScrollText,
} from "lucide-react"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateTeacherQualifications } from "./actions"
import { qualificationsSchema, type QualificationsFormData } from "./validation"

interface QualificationsFormProps {
  teacherId: string
  initialData?: Partial<QualificationsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const QualificationsForm = forwardRef<
  WizardFormRef,
  QualificationsFormProps
>(({ teacherId, initialData, onValidChange }, ref) => {
  const [isPending, startTransition] = useTransition()
  const { dictionary } = useDictionary()
  const teachers = (dictionary?.school as Record<string, unknown>)?.teachers as
    | Record<string, unknown>
    | undefined
  const wizard = teachers?.wizard as Record<string, unknown> | undefined
  const t = wizard?.qualifications as Record<string, string> | undefined
  const tWizard = wizard as Record<string, string> | undefined

  const documentCategories = [
    { key: "degrees", label: t?.degrees || "Degrees", icon: GraduationCap },
    {
      key: "certifications",
      label: t?.certifications || "Certifications",
      icon: Award,
    },
    { key: "cv", label: t?.cv || "CV", icon: FileText },
    { key: "id", label: t?.idDoc || "ID", icon: IdCard },
    { key: "licenses", label: t?.licenses || "Licenses", icon: ScrollText },
    { key: "other", label: t?.other || "Other", icon: FolderOpen },
  ] as const

  const form = useForm<QualificationsFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(qualificationsSchema) as any,
    defaultValues: {
      degrees: initialData?.degrees || "",
      certifications: initialData?.certifications || "",
      cv: initialData?.cv || "",
      id: initialData?.id || "",
      licenses: initialData?.licenses || "",
      other: initialData?.other || "",
    },
  })

  // Qualifications step is optional, always valid
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
                new Error(tWizard?.validationFailed || "Validation failed")
              )
              return
            }
            const data = form.getValues()
            const result = await updateTeacherQualifications(teacherId, data)
            if (!result.success) {
              ErrorToast(
                result.error || tWizard?.failedToSave || "Failed to save"
              )
              reject(new Error(result.error))
              return
            }
            resolve()
          } catch (err) {
            const msg =
              err instanceof Error
                ? err.message
                : tWizard?.failedToSave || "Failed to save"
            ErrorToast(msg)
            reject(err)
          }
        })
      }),
  }))

  return (
    <Form {...form}>
      <form className="grid grid-cols-3 gap-4">
        {documentCategories.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="flex flex-col items-center gap-2 rounded-lg border p-4"
          >
            <Icon className="text-muted-foreground h-8 w-8" />
            <p className="text-sm font-medium">{label}</p>
            <InputField
              name={key}
              label=""
              placeholder={t?.uploadOrEnterUrl || "Upload or enter URL"}
              disabled={isPending}
            />
          </div>
        ))}
      </form>
    </Form>
  )
})

QualificationsForm.displayName = "QualificationsForm"
