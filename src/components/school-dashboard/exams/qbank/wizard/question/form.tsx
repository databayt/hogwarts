"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, SelectField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardTabs, type WizardTab } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  BLOOM_LEVEL_OPTIONS,
  DIFFICULTY_OPTIONS,
  QUESTION_TYPE_OPTIONS,
} from "../config"
import { getSubjectsForQuestion, updateQuestionDetails } from "./actions"
import {
  questionDetailsSchema,
  type QuestionDetailsFormData,
} from "./validation"

function useWizardTabs(): WizardTab[] {
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.qbankUi?.wizard?.question as
    | Record<string, string>
    | undefined
  return [
    { id: "question", label: t?.tabQuestion ?? "Question" },
    { id: "details", label: t?.tabDetails ?? "Details" },
  ]
}

interface QuestionFormProps {
  questionId: string
  initialData?: Partial<QuestionDetailsFormData>
  onValidChange?: (isValid: boolean) => void
  onTabChange?: (tabId: string) => void
}

export const QuestionForm = forwardRef<WizardFormRef, QuestionFormProps>(
  ({ questionId, initialData, onValidChange, onTabChange }, ref) => {
    const { dictionary } = useDictionary()
    const t = dictionary?.school?.exams?.qbankUi?.wizard?.question as
      | Record<string, string>
      | undefined
    const TABS = useWizardTabs()
    const [isPending, startTransition] = useTransition()
    const [subjectOptions, setSubjectOptions] = useState<
      { label: string; value: string }[]
    >([])

    const form = useForm<QuestionDetailsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(questionDetailsSchema) as any,
      defaultValues: {
        subjectId: initialData?.subjectId || "",
        questionText: initialData?.questionText || "",
        questionType: initialData?.questionType || "MULTIPLE_CHOICE",
        difficulty: initialData?.difficulty || "MEDIUM",
        bloomLevel: initialData?.bloomLevel || "REMEMBER",
        points: initialData?.points ?? 1,
        timeEstimate: initialData?.timeEstimate,
        tags: initialData?.tags || "",
        explanation: initialData?.explanation || "",
        imageUrl: initialData?.imageUrl || "",
      },
    })

    // Load subject options
    useEffect(() => {
      getSubjectsForQuestion().then((result) => {
        if (result.success && result.data) {
          setSubjectOptions(
            result.data.map((s) => ({ label: s.name, value: s.id }))
          )
        }
      })
    }, [])

    // Notify parent of validity changes
    const questionText = form.watch("questionText")
    const subjectId = form.watch("subjectId")
    useEffect(() => {
      const isValid =
        questionText.trim().length >= 10 && subjectId.trim().length > 0
      onValidChange?.(isValid)
    }, [questionText, subjectId, onValidChange])

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
              const result = await updateQuestionDetails(questionId, data)
              if (!result.success) {
                ErrorToast(result.error || (t?.saveFailed ?? "Failed to save"))
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : (t?.saveFailed ?? "Failed to save")
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <WizardTabs tabs={TABS} onTabChange={onTabChange}>
            {(activeTab) =>
              activeTab === "question" ? (
                <div className="space-y-6">
                  <SelectField
                    name="subjectId"
                    label={t?.subject ?? "Subject"}
                    options={subjectOptions}
                    required
                    disabled={isPending}
                  />
                  <TextareaField
                    name="questionText"
                    label={t?.questionText ?? "Question Text"}
                    placeholder={
                      t?.questionTextPlaceholder ??
                      "Enter the question (minimum 10 characters)"
                    }
                    required
                    disabled={isPending}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      name="questionType"
                      label={t?.questionType ?? "Question Type"}
                      options={[...QUESTION_TYPE_OPTIONS]}
                      required
                      disabled={isPending}
                    />
                    <SelectField
                      name="difficulty"
                      label={t?.difficulty ?? "Difficulty"}
                      options={[...DIFFICULTY_OPTIONS]}
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      name="bloomLevel"
                      label={t?.bloomLevel ?? "Bloom's Level"}
                      options={[...BLOOM_LEVEL_OPTIONS]}
                      required
                      disabled={isPending}
                    />
                    <InputField
                      name="points"
                      label={t?.points ?? "Points"}
                      type="number"
                      placeholder="1"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <InputField
                    name="timeEstimate"
                    label={t?.timeEstimate ?? "Time Estimate (minutes)"}
                    type="number"
                    placeholder={t?.optional ?? "Optional"}
                    disabled={isPending}
                  />
                  <InputField
                    name="tags"
                    label={t?.tags ?? "Tags"}
                    placeholder={
                      t?.tagsPlaceholder ?? "Enter comma-separated tags"
                    }
                    disabled={isPending}
                  />
                  <TextareaField
                    name="explanation"
                    label={t?.explanation ?? "Explanation"}
                    placeholder={
                      t?.explanationPlaceholder ??
                      "Explain the correct answer (optional)"
                    }
                    disabled={isPending}
                  />
                  <InputField
                    name="imageUrl"
                    label={t?.imageUrl ?? "Image URL"}
                    placeholder={t?.imageUrlPlaceholder ?? "Optional image URL"}
                    disabled={isPending}
                  />
                </div>
              )
            }
          </WizardTabs>
        </form>
      </Form>
    )
  }
)

QuestionForm.displayName = "QuestionForm"
