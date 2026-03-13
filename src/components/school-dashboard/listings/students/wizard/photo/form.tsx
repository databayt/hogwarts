"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { FileUploadField } from "@/components/form/atoms/file-upload"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateStudentPhoto } from "./actions"
import { photoSchema, type PhotoFormData } from "./validation"

interface PhotoFormProps {
  studentId: string
  initialData?: Partial<PhotoFormData>
  onValidChange?: (isValid: boolean) => void
}

export const PhotoForm = forwardRef<WizardFormRef, PhotoFormProps>(
  ({ studentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const { dictionary } = useDictionary()
    const students = (dictionary?.school as any)?.students
    const t = students?.photo as Record<string, string> | undefined
    const tRoot = students as Record<string, string> | undefined

    const form = useForm<PhotoFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(photoSchema) as any,
      defaultValues: {
        profilePhotoUrl: initialData?.profilePhotoUrl || "",
      },
    })

    // Photo step is always valid (optional)
    React.useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const data = form.getValues()
              const result = await updateStudentPhoto(studentId, data)
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
          <FileUploadField
            name="profilePhotoUrl"
            category="image"
            type="avatar"
            folder="student-photos"
            variant="avatar"
            maxSize={5 * 1024 * 1024}
            maxFiles={1}
            optimizeImages
            imageOptimization={{
              maxWidth: 400,
              maxHeight: 400,
              quality: 85,
              format: "webp",
            }}
            disabled={isPending}
            placeholder={t?.uploadPhoto || "Upload student photo"}
          />
        </form>
      </Form>
    )
  }
)

PhotoForm.displayName = "PhotoForm"
