"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Loader2, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useForm, useFormContext } from "react-hook-form"

import { asset } from "@/lib/asset-url"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { useUpload } from "@/components/file/upload/use-upload"
import { FileUploadField } from "@/components/form/atoms/file-upload"

import { useApplySession } from "../application-context"
import type { AttachmentsStepData } from "../types"
import { getApplyDict } from "../utils"
import { saveAttachmentsStep } from "./actions"
import { extractForAutoFill, type AutoFillResult } from "./extract-action"
import type { AttachmentsFormProps, AttachmentsFormRef } from "./types"
import { attachmentsSchema, type AttachmentsFormData } from "./validation"

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
  schoolId,
  uploadedLabel,
  onUploaded,
}: {
  name: string
  label: string
  icon: string
  disabled?: boolean
  schoolId?: string
  uploadedLabel?: string
  onUploaded?: (fileUrl: string) => void
}) {
  const form = useFormContext()
  const currentValue = form.watch(name)
  const hasFile =
    !!currentValue &&
    ((typeof currentValue === "object" && currentValue?.url) ||
      (typeof currentValue === "string" && currentValue.length > 0))

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      form.setValue(name, "")
    },
    [form, name]
  )

  const { isUploading, uploadedFiles, upload, getAcceptedTypes } = useUpload({
    category: "document",
    folder: "apply-documents",
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    schoolId,
    onSuccess: (result) => {
      form.setValue(name, result)
      // Trigger silent AI extraction for auto-fill
      const url =
        typeof result === "string" ? result : (result as { url?: string })?.url
      if (url && onUploaded) onUploaded(url)
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
  const fileUrl =
    typeof currentValue === "string"
      ? currentValue
      : (currentValue as { url?: string })?.url || uploadedFiles[0]?.url || ""
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
            <img
              src={fileUrl}
              alt={label}
              className="h-full w-full object-cover"
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
          <p className="text-sm font-medium">{label}</p>
        </>
      )}
    </div>
  )
}

export const AttachmentsForm = forwardRef<
  AttachmentsFormRef,
  AttachmentsFormProps
>(({ initialData, onSuccess, dictionary }, ref) => {
  const { updateStepData, getStepData } = useApplySession()
  const params = useParams()
  const [schoolId, setSchoolId] = useState<string>()
  const dict = getApplyDict(dictionary, "attachments")

  // Silent AI extraction → auto-fill subsequent steps
  // schoolId is resolved server-side by getTenantContext() — no need to pass it
  const handleDocumentUploaded = useCallback(
    (slotKey: string, fileUrl: string) => {
      extractForAutoFill(fileUrl, slotKey).then((result) => {
        if (!result.success || !result.data) return
        mergeAutoFillData(result.data, getStepData, updateStepData)
      })
    },
    [getStepData, updateStepData]
  )

  // Resolve schoolId from subdomain so applicants (who have no school) can upload
  useEffect(() => {
    const subdomain = params?.subdomain as string | undefined
    if (!subdomain) return
    getSchoolBySubdomain(subdomain).then((result) => {
      if (result.success) setSchoolId(result.data.id)
    })
  }, [params?.subdomain])

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

  const prevDataRef = React.useRef<string>("")
  useEffect(() => {
    const subscription = form.watch((value) => {
      const json = JSON.stringify(value)
      if (json !== prevDataRef.current) {
        prevDataRef.current = json
        updateStepData("attachments", value as unknown as AttachmentsStepData)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, updateStepData])

  const saveAndNext = async () => {
    const raw = form.getValues()
    // Upload hook stores objects {url, name, …} — extract plain URL strings
    const extractUrl = (v: unknown): string =>
      typeof v === "string" ? v : (v as { url?: string })?.url || ""
    const data = {
      profilePhotoUrl: extractUrl(raw.profilePhotoUrl),
      degreeUrl: extractUrl(raw.degreeUrl),
      transcriptUrl: extractUrl(raw.transcriptUrl),
      idUrl: extractUrl(raw.idUrl),
      resumeUrl: extractUrl(raw.resumeUrl),
      otherUrl: extractUrl(raw.otherUrl),
    }
    const result = await saveAttachmentsStep(data)

    if (!result.success) throw new Error(result.error || "SAVE_FAILED")

    if (result.data) {
      updateStepData("attachments", result.data as AttachmentsStepData)
    }

    onSuccess?.()
  }

  useImperativeHandle(ref, () => ({ saveAndNext }))

  return (
    <Form {...form}>
      <form className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Photo - avatar upload */}
        <div className="flex items-center justify-center">
          <FileUploadField
            name="profilePhotoUrl"
            category="image"
            type="avatar"
            folder="apply-photos"
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
            placeholder={dict.photo || "Photo"}
            placeholderImage={asset("/icons/image.png")}
            schoolId={schoolId}
          />
        </div>

        {/* Document slots */}
        {DOCUMENT_SLOT_KEYS.map(({ key, dictKey, icon }) => (
          <DocumentCard
            key={key}
            name={key}
            label={dict[dictKey] || dictKey}
            icon={icon}
            schoolId={schoolId}
            uploadedLabel={dict.uploaded}
            onUploaded={(fileUrl) => handleDocumentUploaded(key, fileUrl)}
          />
        ))}
      </form>
    </Form>
  )
})

AttachmentsForm.displayName = "AttachmentsForm"

// ---------------------------------------------------------------------------
// Merge AI-extracted data into step context, only filling empty fields
// ---------------------------------------------------------------------------

function mergeAutoFillData(
  data: AutoFillResult,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStepData: (step: any) => any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateStepData: (step: any, value: any) => void
) {
  for (const [step, fields] of Object.entries(data)) {
    if (!fields || Object.keys(fields).length === 0) continue

    const existing = (getStepData(step) as Record<string, unknown>) || {}
    const merged = { ...existing }
    let hasNew = false

    for (const [key, value] of Object.entries(fields)) {
      if (value && !existing[key]) {
        merged[key] = value
        hasNew = true
      }
    }

    if (hasNew) {
      updateStepData(step, merged)
    }
  }
}
