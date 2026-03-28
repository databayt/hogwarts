"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Loader2, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useForm, useFormContext } from "react-hook-form"

import { asset } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { useUpload } from "@/components/file/upload/use-upload"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateStudentAttachments } from "./actions"
import { attachmentsSchema, type AttachmentsFormData } from "./validation"

type AttachmentDict = Record<string, string> | undefined

const getDocumentSlots = (t: AttachmentDict) => [
  {
    key: "degreeUrl" as const,
    label: t?.degree || "Degree",
    icon: asset("/icons/degree.png"),
  },
  {
    key: "transcriptUrl" as const,
    label: t?.transcript || "Transcript",
    icon: asset("/icons/transcript.png"),
  },
  {
    key: "idUrl" as const,
    label: t?.id || "ID",
    icon: asset("/icons/id.png"),
  },
  {
    key: "resumeUrl" as const,
    label: t?.resume || "Resume",
    icon: asset("/icons/resume.png"),
  },
  {
    key: "otherUrl" as const,
    label: t?.other || "Other",
    icon: asset("/icons/files.png"),
  },
]

/**
 * A single document upload card — shows first-page preview after upload
 * with label at the bottom and a clear button.
 */
function DocumentCard({
  name,
  label,
  icon,
  disabled,
  onUploaded,
}: {
  name: string
  label: string
  icon: string
  disabled?: boolean
  onUploaded?: (slotKey: string, fileUrl: string) => void
}) {
  const form = useFormContext()
  const currentValue = form.watch(name)
  const hasFile =
    !!currentValue && typeof currentValue === "object" && currentValue?.url
  const fileUrl = hasFile ? currentValue.url : null
  const mimeType = hasFile ? currentValue.mimeType : null
  const isPdf = mimeType === "application/pdf" || fileUrl?.endsWith(".pdf")
  const isImage = mimeType?.startsWith("image/")

  const { isUploading, uploadedFiles, upload, getAcceptedTypes, reset } =
    useUpload({
      category: "document",
      folder: "student-documents",
      maxSize: 10 * 1024 * 1024,
      maxFiles: 1,
      onSuccess: (result) => {
        form.setValue(name, result)
        if (result?.url) onUploaded?.(name, result.url)
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

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    form.setValue(name, "")
    reset()
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border transition-colors",
        isDragActive && "border-primary bg-primary/10",
        disabled && "cursor-not-allowed opacity-50",
        uploaded ? "min-h-[8rem] gap-0" : "gap-2 p-4"
      )}
    >
      <input {...getInputProps()} />
      {/* Clear button */}
      {uploaded && !disabled && (
        <button
          type="button"
          onClick={handleRemove}
          className="bg-muted text-muted-foreground absolute end-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      {/* Content area */}
      {isUploading ? (
        <>
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">{label}</p>
        </>
      ) : uploaded && fileUrl ? (
        <>
          {/* Document first-page preview */}
          <div className="pointer-events-none w-full flex-1">
            {isPdf ? (
              <object
                data={`${fileUrl}#page=1&view=FitH`}
                type="application/pdf"
                className="h-24 w-full"
                aria-label={label}
              >
                <Image src={icon} alt={label} width={32} height={32} />
              </object>
            ) : isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl}
                alt={label}
                className="h-24 w-full object-cover"
              />
            ) : (
              <div className="flex h-24 items-center justify-center">
                <Image src={icon} alt={label} width={32} height={32} />
              </div>
            )}
          </div>
          {/* Label bar at bottom — liquid glass effect */}
          <div
            className="absolute inset-x-0 bottom-0 z-10 py-2 text-center"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 40%, transparent 100%)",
              backdropFilter: "blur(8px) saturate(110%)",
              WebkitBackdropFilter: "blur(8px) saturate(110%)",
              maskImage:
                "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
            }}
          >
            <p className="text-sm font-medium">{label}</p>
          </div>
        </>
      ) : (
        <>
          <Image src={icon} alt={label} width={32} height={32} />
          <p className="text-sm font-medium">{label}</p>
        </>
      )}
    </div>
  )
}

/**
 * Photo upload with avatar circle and clear button.
 */
function PhotoCard({
  name,
  label,
  disabled,
}: {
  name: string
  label: string
  disabled?: boolean
}) {
  const form = useFormContext()
  const currentValue = form.watch(name)
  // currentValue can be a string URL or an upload result object
  const hasPhoto =
    (typeof currentValue === "string" && currentValue.length > 0) ||
    (typeof currentValue === "object" && currentValue?.url)
  const photoUrl =
    typeof currentValue === "string" ? currentValue : currentValue?.url || null

  const { isUploading, upload, getAcceptedTypes, reset } = useUpload({
    category: "image",
    folder: "student-photos",
    maxSize: 5 * 1024 * 1024,
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
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    disabled: disabled || isUploading,
    multiple: false,
  })

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      form.setValue(name, "")
      reset()
    },
    [form, name, reset]
  )

  return (
    <div className="relative flex items-center justify-center">
      <div
        {...getRootProps()}
        className={cn(
          "border-border bg-muted/50 relative h-32 w-32 rounded-full border border-dashed",
          "flex cursor-pointer items-center justify-center transition-colors",
          isDragActive && "border-primary bg-primary/10",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        ) : hasPhoto && photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={label}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Image
              src={asset("/icons/image.png")}
              alt={label}
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-muted-foreground text-xs">{label}</span>
          </div>
        )}
      </div>
      {/* Clear button outside the circle */}
      {hasPhoto && !disabled && !isUploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="bg-muted text-muted-foreground absolute -end-1 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

interface AttachmentsFormProps {
  studentId: string
  initialData?: Partial<AttachmentsFormData>
  onValidChange?: (isValid: boolean) => void
  onDocumentUploaded?: (slotKey: string, fileUrl: string) => void
  dictionary?: AttachmentDict
}

export const AttachmentsForm = forwardRef<WizardFormRef, AttachmentsFormProps>(
  (
    {
      studentId,
      initialData,
      onValidChange,
      onDocumentUploaded,
      dictionary: t,
    },
    ref
  ) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const tRoot = (dictionary?.school as any)?.students as
      | Record<string, string>
      | undefined

    const form = useForm<AttachmentsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(attachmentsSchema) as any,
      defaultValues: {
        profilePhotoUrl: initialData?.profilePhotoUrl || "",
        degreeUrl: initialData?.degreeUrl || "",
        transcriptUrl: initialData?.transcriptUrl || "",
        idUrl: initialData?.idUrl || "",
        resumeUrl: initialData?.resumeUrl || "",
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

    const documentSlots = getDocumentSlots(t)

    return (
      <Form {...form}>
        <form className="grid grid-cols-3 gap-4">
          {/* Photo - circle with clear button */}
          <PhotoCard
            name="profilePhotoUrl"
            label={t?.photo || "Photo"}
            disabled={isPending}
          />

          {/* Document slots — icon+label always visible, badge on upload */}
          {documentSlots.map(({ key, label, icon }) => (
            <DocumentCard
              key={key}
              name={key}
              label={label}
              icon={icon}
              disabled={isPending}
              onUploaded={onDocumentUploaded}
            />
          ))}
        </form>
      </Form>
    )
  }
)

AttachmentsForm.displayName = "AttachmentsForm"
