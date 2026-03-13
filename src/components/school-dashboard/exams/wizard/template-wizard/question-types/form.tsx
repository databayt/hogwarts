"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"

import type { QuestionTypeConfig } from "../../types"
import { updateTemplateQuestionTypes } from "./actions"

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "ESSAY", label: "Essay" },
  { value: "FILL_BLANK", label: "Fill in the Blank" },
  { value: "MATCHING", label: "Matching" },
  { value: "ORDERING", label: "Ordering" },
] as const

const DEFAULT_DIFFICULTY = { EASY: 2, MEDIUM: 2, HARD: 1 }
const DEFAULT_COUNT = 5

interface QuestionTypesFormProps {
  templateId: string
  initialData?: QuestionTypeConfig[]
  onValidChange?: (isValid: boolean) => void
}

export const QuestionTypesForm = forwardRef<
  WizardFormRef,
  QuestionTypesFormProps
>(({ templateId, initialData, onValidChange }, ref) => {
  const [isPending, startTransition] = useTransition()
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeConfig[]>(
    () => initialData ?? []
  )

  // Notify parent of validity
  useEffect(() => {
    onValidChange?.(questionTypes.length > 0)
  }, [questionTypes.length, onValidChange])

  const handleToggle = useCallback((typeValue: string, checked: boolean) => {
    if (checked) {
      setQuestionTypes((curr) => [
        ...curr,
        {
          type: typeValue as QuestionTypeConfig["type"],
          count: DEFAULT_COUNT,
          difficulty: { ...DEFAULT_DIFFICULTY },
        },
      ])
    } else {
      setQuestionTypes((curr) => curr.filter((qt) => qt.type !== typeValue))
    }
  }, [])

  const handleCountChange = useCallback((typeValue: string, delta: number) => {
    setQuestionTypes((curr) =>
      curr.map((qt) => {
        if (qt.type !== typeValue) return qt
        const newCount = Math.max(1, qt.count + delta)
        return { ...qt, count: newCount }
      })
    )
  }, [])

  useImperativeHandle(ref, () => ({
    saveAndNext: () =>
      new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            if (questionTypes.length === 0) {
              ErrorToast("Select at least one question type")
              reject(new Error("Validation failed"))
              return
            }
            const result = await updateTemplateQuestionTypes(templateId, {
              questionTypes,
            })
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
    <div className="space-y-4">
      {QUESTION_TYPES.map((qt) => {
        const selected = questionTypes.find((s) => s.type === qt.value)
        const isChecked = !!selected

        return (
          <div
            key={qt.value}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={qt.value}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  handleToggle(qt.value, checked === true)
                }
                disabled={isPending}
              />
              <label
                htmlFor={qt.value}
                className="cursor-pointer text-sm font-medium"
              >
                {qt.label}
              </label>
            </div>

            {isChecked && selected && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCountChange(qt.value, -1)}
                  disabled={isPending || selected.count <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">
                  {selected.count}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCountChange(qt.value, 1)}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

QuestionTypesForm.displayName = "QuestionTypesForm"
