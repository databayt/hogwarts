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
import { useLocale } from "@/components/internationalization/use-locale"

import type { QuestionTypeConfig } from "../../types"
import {
  commonLabels,
  QUESTION_TYPE_LABELS,
  questionTypesLabels,
} from "../labels"
import { updateTemplateQuestionTypes } from "./actions"

const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
  "FILL_BLANK",
  "MATCHING",
  "ORDERING",
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
  const { locale } = useLocale()
  const lang = locale === "ar" ? "ar" : "en"
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
              ErrorToast(questionTypesLabels.selectAtLeastOne[lang])
              reject(new Error("Validation failed"))
              return
            }
            const result = await updateTemplateQuestionTypes(templateId, {
              questionTypes,
            })
            if (!result.success) {
              ErrorToast(result.error || commonLabels.failedToSave[lang])
              reject(new Error(result.error))
              return
            }
            resolve()
          } catch (err) {
            const msg =
              err instanceof Error
                ? err.message
                : commonLabels.failedToSave[lang]
            ErrorToast(msg)
            reject(err)
          }
        })
      }),
  }))

  return (
    <div className="space-y-4">
      {QUESTION_TYPES.map((qtValue) => {
        const selected = questionTypes.find((s) => s.type === qtValue)
        const isChecked = !!selected
        const qtLabel = QUESTION_TYPE_LABELS[qtValue]?.[lang] || qtValue

        return (
          <div
            key={qtValue}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={qtValue}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  handleToggle(qtValue, checked === true)
                }
                disabled={isPending}
              />
              <label
                htmlFor={qtValue}
                className="cursor-pointer text-sm font-medium"
              >
                {qtLabel}
              </label>
            </div>

            {isChecked && selected && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCountChange(qtValue, -1)}
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
                  onClick={() => handleCountChange(qtValue, 1)}
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
