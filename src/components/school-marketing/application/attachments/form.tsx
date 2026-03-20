"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useEffect, useImperativeHandle } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useForm, useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { useUpload } from "@/components/file/upload/use-upload"
import { FileUploadField } from "@/components/form/atoms/file-upload"

import { useApplySession } from "../application-context"
import type { AttachmentsStepData } from "../types"
import { saveAttachmentsStep } from "./actions"
import type { AttachmentsFormProps, AttachmentsFormRef } from "./types"
import { attachmentsSchema, type AttachmentsFormData } from "./validation"

const DOCUMENT_SLOTS = [
  { key: "degreeUrl" as const, label: "Degree", icon: "/degree.png" },
  {
    key: "transcriptUrl" as const,
    label: "Transcript",
    icon: "/transcript.png",
  },
  { key: "idUrl" as const, label: "ID", icon: "/id.png" },
  { key: "resumeUrl" as const, label: "Resume", icon: "/resume.png" },
  { key: "otherUrl" as const, label: "Other", icon: "/files.png" },
]

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
    folder: "apply-documents",
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
  const fileUrl =
    (currentValue as { url?: string })?.url || uploadedFiles[0]?.url || ""
  const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileUrl)

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
          ) : (
            <object
              data={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              type="application/pdf"
              className="pointer-events-none h-full w-full"
            >
              <CheckCircle className="h-8 w-8 text-green-500" />
            </object>
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
  const { updateStepData } = useApplySession()

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

    if (!result.success) throw new Error(result.error || "Failed to save")

    if (result.data) {
      updateStepData("attachments", result.data as AttachmentsStepData)
    }

    onSuccess?.()
  }

  useImperativeHandle(ref, () => ({ saveAndNext }))

  return (
    <Form {...form}>
      <form className="grid grid-cols-3 gap-4">
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
            placeholder="Photo"
            placeholderImage="/image.png"
          />
        </div>

        {/* Document slots */}
        {DOCUMENT_SLOTS.map(({ key, label, icon }) => (
          <DocumentCard key={key} name={key} label={label} icon={icon} />
        ))}
      </form>
    </Form>
  )
})

AttachmentsForm.displayName = "AttachmentsForm"
