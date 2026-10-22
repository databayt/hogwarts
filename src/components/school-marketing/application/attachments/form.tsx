"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { asset } from "@/lib/asset-url"
import { Form } from "@/components/ui/form"
import {
  DocumentCard,
  STUDENT_DOCUMENT_SLOTS,
} from "@/components/form/atoms/document-card"
import { FileUploadField } from "@/components/form/atoms/file-upload"

import { useApplySession } from "../application-context"
import type { AttachmentsStepData } from "../types"
import { getApplyDict } from "../utils"
import { saveAttachmentsStep } from "./actions"
import { extractForAutoFill, type AutoFillResult } from "./extract-action"
import type { AttachmentsFormProps, AttachmentsFormRef } from "./types"
import { attachmentsSchema, type AttachmentsFormData } from "./validation"

export const AttachmentsForm = forwardRef<
  AttachmentsFormRef,
  AttachmentsFormProps
>(({ initialData, onSuccess, dictionary }, ref) => {
  const { updateStepData, getStepData, saveSession } = useApplySession()
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

  // Sync form when initialData arrives after mount (session loaded async)
  useEffect(() => {
    if (initialData) {
      form.reset({
        profilePhotoUrl: initialData.profilePhotoUrl || "",
        degreeUrl: initialData.degreeUrl || "",
        transcriptUrl: initialData.transcriptUrl || "",
        idUrl: initialData.idUrl || "",
        resumeUrl: initialData.resumeUrl || "",
        otherUrl: initialData.otherUrl || "",
      })
    }
  }, [initialData, form])

  const prevDataRef = React.useRef<string>("")
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    const subscription = form.watch((value) => {
      const json = JSON.stringify(value)
      if (json !== prevDataRef.current) {
        prevDataRef.current = json
        updateStepData("attachments", value as unknown as AttachmentsStepData)
        // Save shortly after upload to avoid "changes may not be saved" on refresh
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => saveSession(), 2000)
      }
    })
    return () => {
      subscription.unsubscribe()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [form, updateStepData, saveSession])

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
          />
        </div>

        {/* Document slots */}
        {STUDENT_DOCUMENT_SLOTS.map(({ key, dictKey, icon }) => (
          <DocumentCard
            key={key}
            name={key}
            folder="apply-documents"
            label={dict[dictKey] || dictKey}
            icon={icon}
            uploadedLabel={dict.uploaded}
            tooLargeLabel={dict.tooLarge}
            invalidTypeLabel={dict.invalidType}
            invalidFileLabel={dict.invalidFile}
            removeLabel={dict.remove}
            pdfLabel={dict.pdf}
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
