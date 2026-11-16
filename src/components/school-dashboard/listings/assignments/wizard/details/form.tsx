"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Paperclip, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { DateField, InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { attachmentName } from "../../assignment-attachments"
import { completeAssignmentWizard } from "../actions"
import { presignAssignmentAttachment, updateAssignmentDetails } from "./actions"
import { detailsSchema, type DetailsFormData } from "./validation"

interface DetailsFormProps {
  assignmentId: string
  initialData?: Partial<DetailsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const DetailsForm = forwardRef<WizardFormRef, DetailsFormProps>(
  ({ assignmentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const { dictionary } = useDictionary()
    const fd = (dictionary?.school as Record<string, any>)?.assignments
      ?.form as Record<string, any> | undefined

    const form = useForm<DetailsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(detailsSchema) as any,
      defaultValues: {
        totalPoints: initialData?.totalPoints ?? 100,
        weight: initialData?.weight ?? 10,
        dueDate: initialData?.dueDate,
        instructions: initialData?.instructions || "",
        attachments: initialData?.attachments ?? [],
      },
    })

    // Teacher-attached files (a photo of the worksheet, a PDF).
    const files = form.watch("attachments") ?? []
    const [uploading, setUploading] = useState(false)
    const fileInput = useRef<HTMLInputElement>(null)

    const handleFiles = async (list: FileList | null) => {
      if (!list || list.length === 0) return
      setUploading(true)
      try {
        let next = [...(form.getValues("attachments") ?? [])]
        for (const file of Array.from(list).slice(0, 10 - next.length)) {
          const failed = () =>
            toast.error(
              (fd?.uploadFailed || "Couldn't upload {name}").replace(
                "{name}",
                file.name
              )
            )
          const res = await presignAssignmentAttachment({
            assignmentId,
            filename: file.name,
            contentType: file.type,
            size: file.size,
          })
          if (!res.success) {
            failed()
            continue
          }
          const put = await fetch(res.data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          })
          if (!put.ok) {
            failed()
            continue
          }
          next = [...next, res.data.fileUrl]
          form.setValue("attachments", next, { shouldDirty: true })
        }
      } finally {
        setUploading(false)
        if (fileInput.current) fileInput.current.value = ""
      }
    }

    // Notify parent of validity changes
    const totalPoints = form.watch("totalPoints")
    const weight = form.watch("weight")
    const dueDate = form.watch("dueDate")
    React.useEffect(() => {
      const isValid =
        totalPoints > 0 && weight > 0 && weight <= 100 && !!dueDate
      onValidChange?.(isValid)
    }, [totalPoints, weight, dueDate, onValidChange])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const valid = await form.trigger()
              if (!valid) {
                reject(new Error("Validation failed"))
                return
              }
              const data = form.getValues()

              // Save details
              const saveResult = await updateAssignmentDetails(
                assignmentId,
                data
              )
              if (!saveResult.success) {
                ErrorToast(saveResult.error || "Failed to save")
                reject(new Error(saveResult.error))
                return
              }

              // Complete the wizard
              const completeResult =
                await completeAssignmentWizard(assignmentId)
              if (!completeResult.success) {
                ErrorToast(completeResult.error || "Failed to complete")
                reject(new Error(completeResult.error))
                return
              }

              // Redirect to assignments list
              router.push("/assignments")
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
        <form className="space-y-6">
          <InputField
            name="totalPoints"
            label={fd?.totalPoints || "Total Points"}
            type="number"
            placeholder="100"
            required
            disabled={isPending}
          />
          <InputField
            name="weight"
            label={fd?.weightPercent || "Weight (%)"}
            type="number"
            placeholder="10"
            required
            disabled={isPending}
          />
          <DateField
            name="dueDate"
            label={fd?.dueDate || "Due Date"}
            required
            disabled={isPending}
          />
          <TextareaField
            name="instructions"
            label={fd?.instructions || "Instructions"}
            placeholder={
              fd?.enterInstructions || "Enter assignment instructions"
            }
            disabled={isPending}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {fd?.attachments || "Assignment attachments (images or PDF)"}
            </p>
            {files.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {files.map((url) => (
                  <li
                    key={url}
                    className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                  >
                    <Paperclip className="h-3 w-3" aria-hidden />
                    <span dir="auto">{attachmentName(url)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        form.setValue(
                          "attachments",
                          files.filter((f) => f !== url),
                          { shouldDirty: true }
                        )
                      }
                      aria-label={fd?.removeFile || "Remove"}
                      className="relative ms-1 after:absolute after:-inset-2 after:content-['']"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput.current?.click()}
              disabled={isPending || uploading || files.length >= 10}
            >
              <Paperclip className="me-2 h-4 w-4" aria-hidden />
              {uploading
                ? fd?.uploading || "Uploading…"
                : fd?.attachFile || "Attach an image or file"}
            </Button>
          </div>
        </form>
      </Form>
    )
  }
)

DetailsForm.displayName = "DetailsForm"
