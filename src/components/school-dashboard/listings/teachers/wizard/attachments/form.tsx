"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useForm, useFormContext } from "react-hook-form"

import { asset } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { useUpload } from "@/components/file/upload/use-upload"
import { FileUploadField } from "@/components/form/atoms/file-upload"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateTeacherAttachments } from "./actions"
import { attachmentsSchema, type AttachmentsFormData } from "./validation"

const ATTACHMENT_SLOTS = [
  {
    key: "degreeUrl" as const,
    label: "Degree",
    icon: asset("/icons/degree.png"),
  },
  {
    key: "resumeUrl" as const,
    label: "Resume",
    icon: asset("/icons/resume.png"),
  },
  { key: "idUrl" as const, label: "ID", icon: asset("/icons/id.png") },
  {
    key: "certificationUrl" as const,
    label: "Certification",
    icon: asset("/icons/transcript.png"),
  },
  { key: "otherUrl" as const, label: "Other", icon: asset("/icons/files.png") },
]

/**
 * A single document upload card — the entire box is the drop target.
 */
function DocumentCard({
  name,
  label,
  icon,
  disabled,
}: {
  name: string
  label: string
  icon: string
  disabled?: boolean
}) {
  const form = useFormContext()
  const currentValue = form.watch(name)
  const hasFile =
    !!currentValue && typeof currentValue === "object" && currentValue?.url

  const { isUploading, uploadedFiles, upload, getAcceptedTypes } = useUpload({
    category: "document",
    folder: "teacher-documents",
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    onSuccess: (result) => {
      form.setValue(name, result)
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      if (files.length > 0) {
        await upload(files[0])
      }
    },
    accept: getAcceptedTypes(),
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled: disabled || isUploading,
    multiple: false,
  })

  const uploaded = hasFile || uploadedFiles.length > 0

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-colors",
        isDragActive && "border-primary bg-primary/10",
        uploaded && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      ) : uploaded ? (
        <CheckCircle className="h-8 w-8 text-green-500" />
      ) : (
        <Image src={icon} alt={label} width={32} height={32} />
      )}
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

interface AttachmentsFormProps {
  teacherId: string
  initialData?: Partial<AttachmentsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const AttachmentsForm = forwardRef<WizardFormRef, AttachmentsFormProps>(
  ({ teacherId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<AttachmentsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(attachmentsSchema) as any,
      defaultValues: {
        profilePhotoUrl: initialData?.profilePhotoUrl || "",
        degreeUrl: initialData?.degreeUrl || "",
        resumeUrl: initialData?.resumeUrl || "",
        idUrl: initialData?.idUrl || "",
        certificationUrl: initialData?.certificationUrl || "",
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
              const result = await updateTeacherAttachments(teacherId, data)
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
          {/* Photo - circle only, no border box */}
          <div className="flex items-center justify-center">
            <FileUploadField
              name="profilePhotoUrl"
              category="image"
              type="avatar"
              folder="teacher-photos"
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
              placeholderImage={asset("/icons/image.png")}
            />
          </div>

          {/* Document slots — entire card is clickable */}
          {ATTACHMENT_SLOTS.map(({ key, label, icon }) => (
            <DocumentCard
              key={key}
              name={key}
              label={label}
              icon={icon}
              disabled={isPending}
            />
          ))}
        </form>
      </Form>
    )
  }
)

AttachmentsForm.displayName = "AttachmentsForm"
