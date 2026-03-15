"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  FileText,
  FolderOpen,
  GraduationCap,
  IdCard,
  ScrollText,
} from "lucide-react"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { FileUploadField } from "@/components/form/atoms/file-upload"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateStudentAttachments } from "./actions"
import { attachmentsSchema, type AttachmentsFormData } from "./validation"

const DOCUMENT_SLOTS = [
  { key: "degreeUrl" as const, label: "Degree", icon: GraduationCap },
  { key: "transcriptUrl" as const, label: "Transcript", icon: ScrollText },
  { key: "idUrl" as const, label: "ID", icon: IdCard },
  { key: "cvUrl" as const, label: "CV", icon: FileText },
  { key: "otherUrl" as const, label: "Other", icon: FolderOpen },
]

interface AttachmentsFormProps {
  studentId: string
  initialData?: Partial<AttachmentsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const AttachmentsForm = forwardRef<WizardFormRef, AttachmentsFormProps>(
  ({ studentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<AttachmentsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(attachmentsSchema) as any,
      defaultValues: {
        profilePhotoUrl: initialData?.profilePhotoUrl || "",
        degreeUrl: initialData?.degreeUrl || "",
        transcriptUrl: initialData?.transcriptUrl || "",
        idUrl: initialData?.idUrl || "",
        cvUrl: initialData?.cvUrl || "",
        otherUrl: initialData?.otherUrl || "",
      },
    })

    // Optional step, always valid
    React.useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const data = form.getValues()
              const result = await updateStudentAttachments(studentId, data)
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
        <form className="grid grid-cols-3 gap-4">
          {/* Photo - circular avatar */}
          <div className="flex flex-col items-center justify-center rounded-lg border p-4">
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
              placeholder="Photo"
            />
          </div>

          {/* Document attachment slots */}
          {DOCUMENT_SLOTS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-2 rounded-lg border p-4"
            >
              <Icon className="text-muted-foreground h-8 w-8" />
              <p className="text-sm font-medium">{label}</p>
              <FileUploadField
                name={key}
                category="document"
                folder="student-documents"
                variant="compact"
                maxSize={10 * 1024 * 1024}
                maxFiles={1}
                disabled={isPending}
                placeholder={`Upload ${label}`}
              />
            </div>
          ))}
        </form>
      </Form>
    )
  }
)

AttachmentsForm.displayName = "AttachmentsForm"
