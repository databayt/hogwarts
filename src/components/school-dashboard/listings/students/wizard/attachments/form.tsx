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
import { FileUploadField } from "@/components/form/atoms/file-upload"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateStudentAttachments } from "./actions"
import { attachmentsSchema, type AttachmentsFormData } from "./validation"

type AttachmentDict = Record<string, string> | undefined

const DOCUMENT_SLOT_KEYS = [
  {
    key: "degreeUrl" as const,
    dictKey: "degree",
    icon: asset("/icons/degree.png"),
  },
  {
    key: "transcriptUrl" as const,
    dictKey: "transcript",
    icon: asset("/icons/transcript.png"),
  },
  { key: "idUrl" as const, dictKey: "id", icon: asset("/icons/id.png") },
  {
    key: "resumeUrl" as const,
    dictKey: "resume",
    icon: asset("/icons/resume.png"),
  },
  {
    key: "otherUrl" as const,
    dictKey: "other",
    icon: asset("/icons/files.png"),
  },
]

function DocumentCard({
  name,
  label,
  icon,
  disabled,
  uploadedLabel,
  onUploaded,
}: {
  name: string
  label: string
  icon: string
  disabled?: boolean
  uploadedLabel?: string
  onUploaded?: (fileUrl: string) => void
}) {
  const form = useFormContext()
  const currentValue = form.watch(name)
  const hasFile =
    !!currentValue &&
    ((typeof currentValue === "object" && currentValue?.url) ||
      (typeof currentValue === "string" && currentValue.length > 0))

  const [rejectionError, setRejectionError] = useState<string | null>(null)

  const {
    isUploading,
    error: uploadError,
    upload,
    reset: resetUpload,
    getAcceptedTypes,
  } = useUpload({
    category: "document",
    folder: "student-documents",
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    onSuccess: (result) => {
      setRejectionError(null)
      form.setValue(name, result)
      const url =
        typeof result === "string" ? result : (result as { url?: string })?.url
      if (url && onUploaded) onUploaded(url)
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      if (files.length > 0) {
        setRejectionError(null)
        await upload(files[0])
      }
    },
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code
      if (code === "file-too-large") {
        setRejectionError("10MB max")
      } else if (code === "file-invalid-type") {
        setRejectionError("PDF, DOC, XLS, TXT")
      } else {
        setRejectionError("Invalid file")
      }
    },
    accept: getAcceptedTypes(),
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled: disabled || isUploading,
    multiple: false,
  })

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      form.setValue(name, "", { shouldDirty: true, shouldTouch: true })
      resetUpload()
      setRejectionError(null)
    },
    [form, name, resetUpload]
  )

  const errorMsg = rejectionError || uploadError

  const uploaded = !!hasFile
  const fileUrl =
    typeof currentValue === "string"
      ? currentValue
      : (currentValue as { url?: string })?.url || ""
  const mimeType =
    typeof currentValue === "object"
      ? (currentValue as { mimeType?: string })?.mimeType || ""
      : ""
  const isImage =
    /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileUrl) ||
    mimeType.startsWith("image/")

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex h-32 cursor-pointer flex-col items-center overflow-hidden rounded-lg border transition-colors",
        errorMsg && "border-destructive",
        isDragActive && "border-primary bg-primary/10",
        disabled && "cursor-not-allowed opacity-50",
        !uploaded && "justify-center gap-2 p-4"
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : uploaded && fileUrl ? (
        <>
          <button
            type="button"
            onClick={handleClear}
            className="absolute end-1.5 top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            aria-label="Remove attachment"
          >
            <X className="h-3 w-3" />
          </button>
          <p
            className="absolute inset-x-0 bottom-0 z-10 truncate px-2 pt-4 pb-1.5 text-center text-sm font-medium text-black dark:text-white"
            style={{
              background:
                "linear-gradient(to top, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)",
              backdropFilter: "blur(8px) saturate(110%)",
              WebkitBackdropFilter: "blur(8px) saturate(110%)",
              maskImage:
                "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
            }}
          >
            {label}
          </p>
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt={label}
              className="relative z-0 h-full w-full object-cover"
            />
          ) : /\.pdf$/i.test(fileUrl) || mimeType === "application/pdf" ? (
            <object
              data={`${fileUrl}#page=1&view=FitH`}
              type="application/pdf"
              className="pointer-events-none h-full w-full"
              aria-label={label}
            >
              <div className="flex flex-1 flex-col items-center justify-center gap-1">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <p className="text-muted-foreground text-xs">PDF</p>
              </div>
            </object>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-1">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-muted-foreground text-xs">
                {uploadedLabel || "Uploaded"}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <Image src={icon} alt={label} width={32} height={32} />
          {errorMsg ? (
            <p className="text-destructive text-xs">{errorMsg}</p>
          ) : (
            <p className="text-sm font-medium">{label}</p>
          )}
        </>
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
              const raw = form.getValues()
              // Upload results are stored as objects { url, mimeType, ... }
              // but the server action expects plain URL strings
              const extractUrl = (v: unknown): string =>
                typeof v === "object" && v !== null && "url" in v
                  ? (v as { url: string }).url
                  : typeof v === "string"
                    ? v
                    : ""
              const data: AttachmentsFormData = {
                profilePhotoUrl: extractUrl(raw.profilePhotoUrl),
                degreeUrl: extractUrl(raw.degreeUrl),
                transcriptUrl: extractUrl(raw.transcriptUrl),
                idUrl: extractUrl(raw.idUrl),
                resumeUrl: extractUrl(raw.resumeUrl),
                otherUrl: extractUrl(raw.otherUrl),
              }
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

    return (
      <Form {...form}>
        <form className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {/* Photo - avatar upload */}
          <div className="flex items-center justify-center">
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
              placeholder={t?.photo || "Photo"}
              placeholderImage={asset("/icons/image.png")}
              disabled={isPending}
            />
          </div>

          {/* Document slots */}
          {DOCUMENT_SLOT_KEYS.map(({ key, dictKey, icon }) => (
            <DocumentCard
              key={key}
              name={key}
              label={t?.[dictKey] || dictKey}
              icon={icon}
              disabled={isPending}
              uploadedLabel={t?.uploaded}
              onUploaded={(fileUrl) => onDocumentUploaded?.(key, fileUrl)}
            />
          ))}
        </form>
      </Form>
    )
  }
)

AttachmentsForm.displayName = "AttachmentsForm"
