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
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateParentInformation } from "./actions"
import { informationSchema, type InformationFormData } from "./validation"

interface InformationFormProps {
  parentId: string
  initialData?: Partial<InformationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const InformationForm = forwardRef<WizardFormRef, InformationFormProps>(
  ({ parentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const d = dictionary?.school?.parents as Record<string, any> | undefined

    const form = useForm<InformationFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(informationSchema) as any,
      defaultValues: {
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        emailAddress: initialData?.emailAddress || "",
        profilePhotoUrl: initialData?.profilePhotoUrl || "",
      },
    })

    // Notify parent of validity changes
    const firstName = form.watch("firstName")
    const lastName = form.watch("lastName")
    React.useEffect(() => {
      const isValid =
        firstName.trim().length >= 1 && lastName.trim().length >= 1
      onValidChange?.(isValid)
    }, [firstName, lastName, onValidChange])

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
              const result = await updateParentInformation(parentId, data)
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
          <InputField
            name="firstName"
            label={d?.firstName || "First Name"}
            placeholder={d?.enterFirstName || "Enter first name"}
            required
            disabled={isPending}
          />
          <InputField
            name="lastName"
            label={d?.lastName || "Last Name"}
            placeholder={d?.enterLastName || "Enter last name"}
            required
            disabled={isPending}
          />
          <InputField
            name="emailAddress"
            label={d?.emailAddress || "Email Address"}
            type="email"
            placeholder="parent@example.com"
            disabled={isPending}
          />
          <InputField
            name="profilePhotoUrl"
            label={d?.profilePhotoUrl || "Profile Photo URL"}
            placeholder="https://..."
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
