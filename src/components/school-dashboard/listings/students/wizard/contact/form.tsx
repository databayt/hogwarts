"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardTabs, type WizardTab } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateStudentContact } from "./actions"
import { contactSchema, type ContactFormData } from "./validation"

interface ContactFormProps {
  studentId: string
  initialData?: Partial<ContactFormData>
  onValidChange?: (isValid: boolean) => void
  onTabChange?: (tabId: string) => void
}

export const ContactForm = forwardRef<WizardFormRef, ContactFormProps>(
  ({ studentId, initialData, onValidChange, onTabChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const students = (dictionary?.school as any)?.students
    const t = students?.contact as Record<string, string> | undefined
    const tRoot = students as Record<string, string> | undefined

    const tabs: WizardTab[] = [
      { id: "contact", label: t?.contactTab || "Contact" },
      { id: "emergency", label: t?.emergencyTab || "Emergency" },
    ]

    const form = useForm<ContactFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(contactSchema) as any,
      defaultValues: {
        email: initialData?.email || "",
        mobileNumber: initialData?.mobileNumber || "",
        alternatePhone: initialData?.alternatePhone || "",
        emergencyContactName: initialData?.emergencyContactName || "",
        emergencyContactPhone: initialData?.emergencyContactPhone || "",
        emergencyContactRelation: initialData?.emergencyContactRelation || "",
      },
    })

    // Contact step is always valid (all fields optional)
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
              const result = await updateStudentContact(studentId, data)
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
          <WizardTabs tabs={tabs} onTabChange={onTabChange}>
            {(activeTab) =>
              activeTab === "contact" ? (
                <div className="space-y-6">
                  <InputField
                    name="email"
                    label={t?.email || "Email"}
                    placeholder={t?.emailPlaceholder || "Enter email address"}
                    type="email"
                    disabled={isPending}
                  />
                  <InputField
                    name="mobileNumber"
                    label={t?.mobile || "Mobile Number"}
                    placeholder={t?.mobilePlaceholder || "Enter mobile number"}
                    disabled={isPending}
                  />
                  <InputField
                    name="alternatePhone"
                    label={t?.alternatePhone || "Alternate Phone"}
                    placeholder={
                      t?.alternatePhonePlaceholder || "Enter alternate phone"
                    }
                    disabled={isPending}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <InputField
                    name="emergencyContactName"
                    label={t?.emergencyName || "Emergency Contact Name"}
                    placeholder={
                      t?.emergencyNamePlaceholder ||
                      "Enter emergency contact name"
                    }
                    disabled={isPending}
                  />
                  <InputField
                    name="emergencyContactPhone"
                    label={t?.emergencyPhone || "Emergency Contact Phone"}
                    placeholder={
                      t?.emergencyPhonePlaceholder ||
                      "Enter emergency contact phone"
                    }
                    disabled={isPending}
                  />
                  <InputField
                    name="emergencyContactRelation"
                    label={t?.relationship || "Relationship"}
                    placeholder={
                      t?.relationshipPlaceholder ||
                      "Enter relationship to student"
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

ContactForm.displayName = "ContactForm"
