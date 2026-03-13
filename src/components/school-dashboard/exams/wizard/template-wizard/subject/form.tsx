"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateTemplateSubject } from "./actions"
import { subjectSchema, type SubjectFormData } from "./validation"

interface SubjectFormProps {
  templateId: string
  initialData?: Partial<SubjectFormData>
  onValidChange?: (isValid: boolean) => void
  subjectOptions: { id: string; subjectName: string }[]
}

export const SubjectForm = forwardRef<WizardFormRef, SubjectFormProps>(
  ({ templateId, initialData, onValidChange, subjectOptions }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<SubjectFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(subjectSchema) as any,
      defaultValues: {
        subjectId: initialData?.subjectId || "",
      },
    })

    const selectedSubjectId = form.watch("subjectId")
    React.useEffect(() => {
      const isValid = selectedSubjectId.trim().length >= 1
      onValidChange?.(isValid)
    }, [selectedSubjectId, onValidChange])

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
              const result = await updateTemplateSubject(templateId, data)
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
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {subjectOptions.map((subject) => (
                      <Badge
                        key={subject.id}
                        variant={
                          field.value === subject.id ? "default" : "outline"
                        }
                        className="cursor-pointer px-3 py-1.5 text-sm"
                        onClick={() => {
                          if (!isPending) {
                            field.onChange(subject.id)
                          }
                        }}
                      >
                        {subject.subjectName}
                      </Badge>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    )
  }
)

SubjectForm.displayName = "SubjectForm"
