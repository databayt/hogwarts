"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { asset } from "@/lib/asset-url"
import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import {
  DocumentCard,
  STUDENT_DOCUMENT_SLOTS,
} from "@/components/form/atoms/document-card"
import { FileUploadField } from "@/components/form/atoms/file-upload"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateStudentAttachments } from "./actions"
import { attachmentsSchema, type AttachmentsFormData } from "./validation"

type AttachmentDict = Record<string, string> | undefined

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
                  actionErrorMessage(
                    result.error,
                    dictionary,
                    tRoot?.failedToSave || "Failed to save"
                  )
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg = tRoot?.failedToSave || "Failed to save"
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
          {STUDENT_DOCUMENT_SLOTS.map(({ key, dictKey, icon }) => (
            <DocumentCard
              key={key}
              name={key}
              folder="student-documents"
              label={t?.[dictKey] || dictKey}
              icon={icon}
              disabled={isPending}
              uploadedLabel={t?.uploaded}
              tooLargeLabel={t?.tooLarge}
              invalidTypeLabel={t?.invalidType}
              invalidFileLabel={t?.invalidFile}
              removeLabel={t?.remove}
              onUploaded={(fileUrl) => onDocumentUploaded?.(key, fileUrl)}
            />
          ))}
        </form>
      </Form>
    )
  }
)

AttachmentsForm.displayName = "AttachmentsForm"
