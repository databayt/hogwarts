"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { CheckboxField, InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { completeParentWizard } from "../actions"
import { updateParentContact } from "./actions"
import { contactSchema, type ContactFormData } from "./validation"

const PHONE_TYPE_OPTIONS = [
  { label: "Mobile", value: "mobile" },
  { label: "Home", value: "home" },
  { label: "Work", value: "work" },
  { label: "Emergency", value: "emergency" },
]

interface ContactFormProps {
  parentId: string
  initialData?: Partial<ContactFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ContactForm = forwardRef<WizardFormRef, ContactFormProps>(
  ({ parentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const form = useForm<ContactFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(contactSchema) as any,
      defaultValues: {
        phoneNumbers: initialData?.phoneNumbers || [],
      },
    })

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "phoneNumbers",
    })

    // Contact step is always valid (phone numbers are optional)
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

              // Save phone numbers
              const saveResult = await updateParentContact(parentId, data)
              if (!saveResult.success) {
                ErrorToast(saveResult.error || "Failed to save")
                reject(new Error(saveResult.error))
                return
              }

              // Complete the wizard
              const completeResult = await completeParentWizard(parentId)
              if (!completeResult.success) {
                ErrorToast(completeResult.error || "Failed to complete")
                reject(new Error(completeResult.error))
                return
              }

              // Redirect to parents list
              router.push("/parents")
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Phone Numbers</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    phoneType: "mobile",
                    phoneNumber: "",
                    isPrimary: fields.length === 0,
                  })
                }
                disabled={isPending}
              >
                <Plus className="me-1 h-4 w-4" />
                Add Phone
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-muted/50 space-y-4 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between">
                  <SelectField
                    name={`phoneNumbers.${index}.phoneType`}
                    label="Type"
                    options={PHONE_TYPE_OPTIONS}
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <InputField
                  name={`phoneNumbers.${index}.phoneNumber`}
                  label="Phone Number"
                  placeholder="+1234567890"
                  required
                  disabled={isPending}
                />
                <CheckboxField
                  name={`phoneNumbers.${index}.isPrimary`}
                  label="Primary"
                  checkboxLabel="Set as primary phone number"
                  disabled={isPending}
                />
              </div>
            ))}
          </div>
        </form>
      </Form>
    )
  }
)

ContactForm.displayName = "ContactForm"
