"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useTransition,
} from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { CheckboxField, InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { completeQuestionWizard } from "../actions"
import { useQuestionWizard } from "../use-question-wizard"
import { updateQuestionAnswers } from "./actions"
import { answersSchema, type AnswersFormData } from "./validation"

interface AnswersFormProps {
  questionId: string
  initialData?: Partial<AnswersFormData>
  onValidChange?: (isValid: boolean) => void
}

export const AnswersForm = forwardRef<WizardFormRef, AnswersFormProps>(
  ({ questionId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const params = useParams()
    const { data: wizardData } = useQuestionWizard()
    const questionType = wizardData?.questionType || "MULTIPLE_CHOICE"

    const form = useForm<AnswersFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(answersSchema) as any,
      defaultValues: {
        options: initialData?.options || [
          { text: "", isCorrect: true, explanation: "" },
          { text: "", isCorrect: false, explanation: "" },
        ],
        acceptedAnswers: initialData?.acceptedAnswers || [""],
        caseSensitive: initialData?.caseSensitive ?? false,
        sampleAnswer: initialData?.sampleAnswer || "",
        gradingRubric: initialData?.gradingRubric || "",
      },
    })

    const {
      fields: optionFields,
      append: appendOption,
      remove: removeOption,
    } = useFieldArray({
      control: form.control,
      name: "options",
    })

    const {
      fields: acceptedFields,
      append: appendAccepted,
      remove: removeAccepted,
    } = useFieldArray({
      control: form.control,
      name: "acceptedAnswers" as never,
    })

    // Compute validity based on question type
    const watchedOptions = form.watch("options")
    const watchedAccepted = form.watch("acceptedAnswers")
    const watchedSample = form.watch("sampleAnswer")

    const computeValidity = useCallback(() => {
      switch (questionType) {
        case "MULTIPLE_CHOICE":
        case "MULTI_SELECT": {
          const opts = watchedOptions || []
          const hasText = opts.length >= 2 && opts.every((o) => o.text.trim())
          const hasCorrect = opts.some((o) => o.isCorrect)
          return hasText && hasCorrect
        }
        case "TRUE_FALSE": {
          const opts = watchedOptions || []
          return opts.some((o) => o.isCorrect)
        }
        case "FILL_BLANK": {
          const accepted = watchedAccepted || []
          return (
            accepted.length > 0 &&
            accepted.some((a) => {
              const val =
                typeof a === "string" ? a : (a as { text?: string })?.text
              return val && val.trim().length > 0
            })
          )
        }
        case "SHORT_ANSWER":
          return (watchedSample || "").trim().length > 0
        case "ESSAY":
          return (watchedSample || "").trim().length >= 50
        case "MATCHING": {
          const opts = watchedOptions || []
          return (
            opts.length >= 2 &&
            opts.every((o) => o.text.trim() && (o.explanation || "").trim())
          )
        }
        case "ORDERING": {
          const opts = watchedOptions || []
          return opts.length >= 2 && opts.every((o) => o.text.trim())
        }
        default:
          return true
      }
    }, [questionType, watchedOptions, watchedAccepted, watchedSample])

    useEffect(() => {
      onValidChange?.(computeValidity())
    }, [computeValidity, onValidChange])

    // Initialize TRUE_FALSE options if needed
    useEffect(() => {
      if (questionType === "TRUE_FALSE") {
        const currentOpts = form.getValues("options") || []
        if (
          currentOpts.length !== 2 ||
          currentOpts[0]?.text !== "True" ||
          currentOpts[1]?.text !== "False"
        ) {
          form.setValue("options", [
            { text: "True", isCorrect: true, explanation: "" },
            { text: "False", isCorrect: false, explanation: "" },
          ])
        }
      }
    }, [questionType, form])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const data = form.getValues()
              const result = await updateQuestionAnswers(questionId, data)
              if (!result.success) {
                ErrorToast(result.error || "Failed to save")
                reject(new Error(result.error))
                return
              }

              const completeResult = await completeQuestionWizard(questionId)
              if (!completeResult.success) {
                ErrorToast(completeResult.error || "Failed to complete")
                reject(new Error(completeResult.error))
                return
              }

              router.push("/exams/qbank")
              resolve()
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    const handleTrueFalseChange = (index: number) => {
      const opts = form.getValues("options") || []
      const updated = opts.map((o, i) => ({
        ...o,
        isCorrect: i === index,
      }))
      form.setValue("options", updated)
    }

    const handleMCQCorrectChange = (index: number) => {
      if (questionType === "MULTI_SELECT") return
      const opts = form.getValues("options") || []
      const updated = opts.map((o, i) => ({
        ...o,
        isCorrect: i === index,
      }))
      form.setValue("options", updated)
    }

    return (
      <Form {...form}>
        <form className="space-y-6">
          {/* MULTIPLE_CHOICE */}
          {questionType === "MULTIPLE_CHOICE" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Answer Options</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendOption({
                      text: "",
                      isCorrect: false,
                      explanation: "",
                    })
                  }
                  disabled={isPending}
                >
                  <Plus className="me-1 h-4 w-4" />
                  Add Option
                </Button>
              </div>
              {optionFields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-muted/50 space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground text-sm">
                      Option {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={isPending || optionFields.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <InputField
                    name={`options.${index}.text`}
                    label="Text"
                    placeholder="Enter option text"
                    required
                    disabled={isPending}
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={form.watch(`options.${index}.isCorrect`)}
                        onChange={() => handleMCQCorrectChange(index)}
                        disabled={isPending}
                      />
                      Correct Answer
                    </label>
                  </div>
                  <InputField
                    name={`options.${index}.explanation`}
                    label="Explanation"
                    placeholder="Optional explanation"
                    disabled={isPending}
                  />
                </div>
              ))}
            </div>
          )}

          {/* MULTI_SELECT */}
          {questionType === "MULTI_SELECT" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Answer Options (select all correct)
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendOption({
                      text: "",
                      isCorrect: false,
                      explanation: "",
                    })
                  }
                  disabled={isPending}
                >
                  <Plus className="me-1 h-4 w-4" />
                  Add Option
                </Button>
              </div>
              {optionFields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-muted/50 space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground text-sm">
                      Option {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={isPending || optionFields.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <InputField
                    name={`options.${index}.text`}
                    label="Text"
                    placeholder="Enter option text"
                    required
                    disabled={isPending}
                  />
                  <CheckboxField
                    name={`options.${index}.isCorrect`}
                    label="Correct"
                    checkboxLabel="Mark as correct answer"
                    disabled={isPending}
                  />
                  <InputField
                    name={`options.${index}.explanation`}
                    label="Explanation"
                    placeholder="Optional explanation"
                    disabled={isPending}
                  />
                </div>
              ))}
            </div>
          )}

          {/* TRUE_FALSE */}
          {questionType === "TRUE_FALSE" && (
            <div className="space-y-4">
              <h4 className="font-medium">Select the Correct Answer</h4>
              {["True", "False"].map((label, index) => (
                <label
                  key={label}
                  className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4"
                >
                  <input
                    type="radio"
                    name="trueFalseCorrect"
                    checked={form.watch(`options.${index}.isCorrect`)}
                    onChange={() => handleTrueFalseChange(index)}
                    disabled={isPending}
                  />
                  <span className="font-medium">{label}</span>
                </label>
              ))}
            </div>
          )}

          {/* FILL_BLANK */}
          {questionType === "FILL_BLANK" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Accepted Answers</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendAccepted("" as never)}
                  disabled={isPending}
                >
                  <Plus className="me-1 h-4 w-4" />
                  Add Answer
                </Button>
              </div>
              {acceptedFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <InputField
                    name={`acceptedAnswers.${index}`}
                    label={`Answer ${index + 1}`}
                    placeholder="Enter accepted answer"
                    required
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeAccepted(index)}
                    disabled={isPending || acceptedFields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <CheckboxField
                name="caseSensitive"
                label="Case Sensitivity"
                checkboxLabel="Answers are case-sensitive"
                disabled={isPending}
              />
            </div>
          )}

          {/* SHORT_ANSWER */}
          {questionType === "SHORT_ANSWER" && (
            <div className="space-y-4">
              <TextareaField
                name="sampleAnswer"
                label="Sample Answer"
                placeholder="Enter the expected sample answer"
                required
                disabled={isPending}
              />
              <TextareaField
                name="gradingRubric"
                label="Grading Rubric"
                placeholder="Describe how to grade this answer (optional)"
                disabled={isPending}
              />
            </div>
          )}

          {/* ESSAY */}
          {questionType === "ESSAY" && (
            <div className="space-y-4">
              <TextareaField
                name="sampleAnswer"
                label="Sample Answer"
                placeholder="Enter a model answer (minimum 50 characters)"
                required
                disabled={isPending}
              />
              <TextareaField
                name="gradingRubric"
                label="Grading Rubric"
                placeholder="Describe rubric criteria (minimum 20 characters)"
                required
                disabled={isPending}
              />
            </div>
          )}

          {/* MATCHING */}
          {questionType === "MATCHING" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Matching Pairs</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendOption({
                      text: "",
                      isCorrect: false,
                      explanation: "",
                    })
                  }
                  disabled={isPending}
                >
                  <Plus className="me-1 h-4 w-4" />
                  Add Pair
                </Button>
              </div>
              {optionFields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-muted/50 space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground text-sm">
                      Pair {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={isPending || optionFields.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <InputField
                    name={`options.${index}.text`}
                    label="Left Item"
                    placeholder="Enter left side item"
                    required
                    disabled={isPending}
                  />
                  <InputField
                    name={`options.${index}.explanation`}
                    label="Right Match"
                    placeholder="Enter matching right side item"
                    required
                    disabled={isPending}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ORDERING */}
          {questionType === "ORDERING" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Items in Correct Order</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendOption({
                      text: "",
                      isCorrect: true,
                      explanation: "",
                    })
                  }
                  disabled={isPending}
                >
                  <Plus className="me-1 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                Enter items in the correct sequence. Students will need to
                reorder them.
              </p>
              {optionFields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-muted/50 flex items-center gap-2 rounded-lg border p-4"
                >
                  <span className="text-muted-foreground w-8 text-sm font-medium">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <InputField
                      name={`options.${index}.text`}
                      label={`Item ${index + 1}`}
                      placeholder="Enter item text"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeOption(index)}
                    disabled={isPending || optionFields.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </form>
      </Form>
    )
  }
)

AnswersForm.displayName = "AnswersForm"
