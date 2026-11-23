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
import { Paperclip, Sparkles, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { DateField, InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { requestLessonDraft } from "@/components/lesson-draft/client"
import { LessonPicker } from "@/components/school-dashboard/live/lesson-picker"

import { attachmentName } from "../../assignment-attachments"
import { completeAssignmentWizard } from "../actions"
import {
  getAssignmentDetails,
  getLessonOptionsForAssignment,
  presignAssignmentAttachment,
  updateAssignmentDetails,
} from "./actions"
import { assignmentValidationOf } from "../../validation-messages"
import { createDetailsSchema, type DetailsFormData } from "./validation"

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
    const formMessages = ((dictionary as any)?.assignments?.form ?? {}) as Record<string, string>
    const fd = (dictionary?.school as Record<string, any>)?.assignments
      ?.form as Record<string, any> | undefined

    const form = useForm<DetailsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(
        createDetailsSchema(assignmentValidationOf(dictionary))
      ) as any,
      defaultValues: {
        totalPoints: initialData?.totalPoints ?? 100,
        weight: initialData?.weight ?? 10,
        dueDate: initialData?.dueDate,
        instructions: initialData?.instructions || "",
        attachments: initialData?.attachments ?? [],
      },
    })

    // «اقترح من الدرس»: fills THIS draft from the textbook lesson. The server
    // says whether the feature is on — the client never reads env.
    const ld = (dictionary as Record<string, any>)?.liveClasses?.lessonDraft as
      | Record<string, any>
      | undefined
    const [lessonOpts, setLessonOpts] = useState<{
      lessons: { id: string; name: string }[]
      suggestedId: string | null
    } | null>(null)
    const [lessonOpen, setLessonOpen] = useState(false)
    const [lessonId, setLessonId] = useState("")
    const [topic, setTopic] = useState("")
    const [needTopic, setNeedTopic] = useState(false)
    const [suggesting, setSuggesting] = useState(false)
    const [suggestStage, setSuggestStage] = useState("")

    React.useEffect(() => {
      let live = true
      void getLessonOptionsForAssignment(assignmentId).then((res) => {
        if (!live || !res.success || !res.data?.enabled) return
        setLessonOpts(res.data)
        setLessonId(res.data.suggestedId ?? "")
      })
      return () => {
        live = false
      }
    }, [assignmentId])

    const suggestFromLesson = async () => {
      setSuggesting(true)
      const outcome = await requestLessonDraft(
        {
          assignmentId,
          homeworkOnly: true,
          lessonId: lessonId || undefined,
          topic: needTopic ? topic.trim() : undefined,
        },
        (stage) => setSuggestStage(ld?.stages?.[stage] ?? "")
      )
      setSuggesting(false)
      setSuggestStage("")
      if (!outcome.ok) {
        if (outcome.code === "LESSON_DRAFT_NO_TEXT") setNeedTopic(true)
        ErrorToast(ld?.errors?.[outcome.code] ?? ld?.errors?.UNKNOWN ?? "")
        return
      }
      // The server filled the draft: reload the form's values from it
      const fresh = await getAssignmentDetails(assignmentId)
      if (fresh.success && fresh.data) {
        form.reset(
          {
            ...form.getValues(),
            totalPoints: fresh.data.totalPoints,
            dueDate: fresh.data.dueDate,
            instructions: fresh.data.instructions ?? "",
          },
          { keepDefaultValues: false }
        )
      }
      setLessonOpen(false)
    }

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
              (fd?.uploadFailed ?? "").replace(
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
                ErrorToast(
                  actionErrorMessage(saveResult.error, dictionary, formMessages.saveFailed ?? "")
                )
                reject(new Error(saveResult.error))
                return
              }

              // Complete the wizard
              const completeResult =
                await completeAssignmentWizard(assignmentId)
              if (!completeResult.success) {
                ErrorToast(
                  actionErrorMessage(
                    completeResult.error,
                    dictionary,
                    formMessages.completeFailed ?? ""
                  )
                )
                reject(new Error(completeResult.error))
                return
              }

              // Redirect to assignments list
              router.push("/assignments")
              resolve()
            } catch (err) {
              ErrorToast(actionErrorMessage("UNKNOWN", dictionary, formMessages.saveFailed ?? ""))
              reject(err)
            }
          })
        }),
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          {lessonOpts && ld && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full sm:w-auto"
                onClick={() => setLessonOpen((o) => !o)}
                disabled={isPending || suggesting}
                aria-expanded={lessonOpen}
              >
                <Sparkles className="me-2 h-4 w-4" aria-hidden />
                {ld.homeworkButton}
              </Button>
              {lessonOpen && (
                <div className="space-y-3 rounded-md border p-3">
                  <LessonPicker
                    id="wizard-lesson"
                    lessons={lessonOpts.lessons}
                    value={lessonId}
                    onChange={setLessonId}
                    suggestedId={lessonOpts.suggestedId}
                    disabled={suggesting}
                    labels={{
                      label: ld.pickerLabel,
                      placeholder: ld.pickerPlaceholder,
                      suggested: ld.suggested,
                    }}
                  />
                  {needTopic && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium" htmlFor="wizard-topic">
                        {ld.topicLabel}
                      </label>
                      <textarea
                        id="wizard-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={ld.topicPlaceholder}
                        maxLength={500}
                        rows={2}
                        disabled={suggesting}
                        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                      />
                      <p className="text-muted-foreground text-xs">
                        {ld.topicHint}
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    className="h-12 w-full"
                    onClick={suggestFromLesson}
                    disabled={
                      suggesting ||
                      !lessonId ||
                      (needTopic && topic.trim().length < 40)
                    }
                  >
                    {suggesting ? ld.working : ld.homeworkButton}
                  </Button>
                  <p
                    role="status"
                    aria-live="polite"
                    className="text-muted-foreground text-sm"
                  >
                    {suggestStage}
                  </p>
                </div>
              )}
            </div>
          )}
          <InputField
            name="totalPoints"
            label={fd?.totalPoints ?? ""}
            type="number"
            placeholder="100"
            required
            disabled={isPending}
          />
          <InputField
            name="weight"
            label={fd?.weightPercent ?? ""}
            type="number"
            placeholder="10"
            required
            disabled={isPending}
          />
          <DateField
            name="dueDate"
            label={fd?.dueDate ?? ""}
            required
            disabled={isPending}
          />
          <TextareaField
            name="instructions"
            label={fd?.instructions ?? ""}
            placeholder={
              fd?.enterInstructions ?? ""
            }
            disabled={isPending}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {fd?.attachments ?? ""}
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
                      aria-label={fd?.removeFile ?? ""}
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
                ? fd?.uploading ?? ""
                : fd?.attachFile ?? ""}
            </Button>
          </div>
        </form>
      </Form>
    )
  }
)

DetailsForm.displayName = "DetailsForm"
