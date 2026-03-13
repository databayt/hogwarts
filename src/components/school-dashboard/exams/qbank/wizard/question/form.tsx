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

const TABS: WizardTab[] = [
  { id: "question", label: "Question" },
  { id: "details", label: "Details" },
]

interface QuestionFormProps {
  questionId: string
  initialData?: Partial<QuestionDetailsFormData>
  onValidChange?: (isValid: boolean) => void
  onTabChange?: (tabId: string) => void
}

export const QuestionForm = forwardRef<WizardFormRef, QuestionFormProps>(
  ({ questionId, initialData, onValidChange, onTabChange }, ref) => {
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
            result.data.map((s) => ({ label: s.subjectName, value: s.id }))
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
                ErrorToast(result.error || "Failed to save")
                reject(new Error(result.error))
                return
              }
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
          <WizardTabs tabs={TABS} onTabChange={onTabChange}>
            {(activeTab) =>
              activeTab === "question" ? (
                <div className="space-y-6">
                  <SelectField
                    name="subjectId"
                    label="Subject"
                    options={subjectOptions}
                    required
                    disabled={isPending}
                  />
                  <TextareaField
                    name="questionText"
                    label="Question Text"
                    placeholder="Enter the question (minimum 10 characters)"
                    required
                    disabled={isPending}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      name="questionType"
                      label="Question Type"
                      options={[...QUESTION_TYPE_OPTIONS]}
                      required
                      disabled={isPending}
                    />
                    <SelectField
                      name="difficulty"
                      label="Difficulty"
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
                      label="Bloom's Level"
                      options={[...BLOOM_LEVEL_OPTIONS]}
                      required
                      disabled={isPending}
                    />
                    <InputField
                      name="points"
                      label="Points"
                      type="number"
                      placeholder="1"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <InputField
                    name="timeEstimate"
                    label="Time Estimate (minutes)"
                    type="number"
                    placeholder="Optional"
                    disabled={isPending}
                  />
                  <InputField
                    name="tags"
                    label="Tags"
                    placeholder="Enter comma-separated tags"
                    disabled={isPending}
                  />
                  <TextareaField
                    name="explanation"
                    label="Explanation"
                    placeholder="Explain the correct answer (optional)"
                    disabled={isPending}
                  />
                  <InputField
                    name="imageUrl"
                    label="Image URL"
                    placeholder="Optional image URL"
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
