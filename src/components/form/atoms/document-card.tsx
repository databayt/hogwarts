"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Document Card (Atom)
 *
 * One drop-zone slot of the student `attachments` step — shared by BOTH
 * student-intake wizards so they render and behave the same:
 *
 *  - `school-dashboard/listings/students/wizard/attachments/` (ADMIN_DIRECT)
 *  - `school-marketing/application/attachments/`              (PORTAL)
 *
 * The two used to carry their own copies and drifted: the portal lost photo
 * uploads, the dashboard lost the PDF thumbnail. Same reasoning as the shared
 * `../attachments-schema.ts`. Reads/writes `name` on the surrounding
 * react-hook-form context; the stored value is the upload result object
 * (`{ url, mimeType, … }`) or a plain URL string from a saved draft.
 */
import React, { useCallback, useState } from "react"
import Image from "next/image"
import { CheckCircle, Loader2, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useFormContext } from "react-hook-form"

import { asset } from "@/lib/asset-url"
import { normalizeUploadUrl } from "@/lib/upload-url"
import { cn } from "@/lib/utils"
import { PdfThumbnail } from "@/components/file/pdf-thumbnail"
import { useUpload } from "@/components/file/upload/use-upload"
import { getAllowedMimeTypes } from "@/components/file/upload/validation"

// Families photograph a birth certificate as often as they scan it to PDF, and
// the card already previews images — so the slots take photos too.
const DOCUMENT_IMAGE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/heic": [".heic"],
}
const DOCUMENT_ALLOWED_TYPES = [
  ...getAllowedMimeTypes("document"),
  ...Object.keys(DOCUMENT_IMAGE_TYPES),
]
const MAX_SIZE = 10 * 1024 * 1024

/** The five document slots of the student attachments step, in grid order. */
export const STUDENT_DOCUMENT_SLOTS = [
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

export interface DocumentCardProps {
  name: string
  label: string
  icon: string
  /** Storage folder under the tenant prefix */
  folder: string
  disabled?: boolean
  onUploaded?: (fileUrl: string) => void
  uploadedLabel?: string
  tooLargeLabel?: string
  invalidTypeLabel?: string
  invalidFileLabel?: string
  removeLabel?: string
  pdfLabel?: string
}

export function DocumentCard({
  name,
  label,
  icon,
  folder,
  disabled,
  onUploaded,
  // Defaults kept so a caller that forgets the dictionary degrades to English
  // rather than rendering blank.
  uploadedLabel = "Uploaded",
  tooLargeLabel = "File too large (10MB max)",
  invalidTypeLabel = "Unsupported file type",
  invalidFileLabel = "Invalid file",
  removeLabel = "Remove attachment",
  pdfLabel = "PDF",
}: DocumentCardProps) {
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
    allowedTypes: DOCUMENT_ALLOWED_TYPES,
    folder,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    onSuccess: (result) => {
      setRejectionError(null)
      form.setValue(name, result, { shouldDirty: true })
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
        setRejectionError(tooLargeLabel)
      } else if (code === "file-invalid-type") {
        setRejectionError(invalidTypeLabel)
      } else {
        setRejectionError(invalidFileLabel)
      }
    },
    accept: { ...getAcceptedTypes(), ...DOCUMENT_IMAGE_TYPES },
    maxSize: MAX_SIZE,
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
  const fileUrl = normalizeUploadUrl(
    typeof currentValue === "string"
      ? currentValue
      : (currentValue as { url?: string })?.url || ""
  )
  const mimeType =
    typeof currentValue === "object"
      ? (currentValue as { mimeType?: string })?.mimeType || ""
      : ""
  const isImage =
    /\.(jpe?g|png|gif|webp|bmp|svg|heic)$/i.test(fileUrl) ||
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
            aria-label={removeLabel}
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
            <PdfThumbnail
              url={fileUrl}
              label={label}
              className="relative z-0"
              fallback={
                <div className="flex flex-col items-center justify-center gap-1">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="text-muted-foreground text-xs">{pdfLabel}</p>
                </div>
              }
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-1">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-muted-foreground text-xs">{uploadedLabel}</p>
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
