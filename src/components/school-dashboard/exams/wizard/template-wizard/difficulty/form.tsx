"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useTransition,
} from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateTemplateDifficulty } from "./actions"

const DIFFICULTY_LEVELS = [
  { key: "EASY" as const, label: "Easy", color: "bg-emerald-500" },
  { key: "MEDIUM" as const, label: "Medium", color: "bg-amber-500" },
  { key: "HARD" as const, label: "Hard", color: "bg-red-500" },
]

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  FILL_BLANK: "Fill in the Blank",
  MATCHING: "Matching",
  ORDERING: "Ordering",
}

interface DifficultyFormProps {
  templateId: string
  questionType: string
  totalCount: number
  initialDifficulty: { EASY: number; MEDIUM: number; HARD: number }
  onValidChange?: (isValid: boolean) => void
}

export const DifficultyForm = forwardRef<WizardFormRef, DifficultyFormProps>(
  (
    { templateId, questionType, totalCount, initialDifficulty, onValidChange },
    ref
  ) => {
    const [isPending, startTransition] = useTransition()
    const [difficulty, setDifficulty] = useState(() => ({
      EASY: initialDifficulty.EASY,
      MEDIUM: initialDifficulty.MEDIUM,
      HARD: initialDifficulty.HARD,
    }))

    const distributed = useMemo(
      () => difficulty.EASY + difficulty.MEDIUM + difficulty.HARD,
      [difficulty]
    )

    const progressPercent = useMemo(
      () =>
        totalCount > 0 ? Math.min((distributed / totalCount) * 100, 100) : 0,
      [distributed, totalCount]
    )

    const isValid = distributed === totalCount

    useEffect(() => {
      onValidChange?.(isValid)
    }, [isValid, onValidChange])

    const handleChange = useCallback(
      (key: "EASY" | "MEDIUM" | "HARD", value: number) => {
        setDifficulty((curr) => ({
          ...curr,
          [key]: Math.max(0, Math.min(value, totalCount)),
        }))
      },
      [totalCount]
    )

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              if (!isValid) {
                ErrorToast(
                  `Distribution must equal ${totalCount} (currently ${distributed})`
                )
                reject(new Error("Validation failed"))
                return
              }
              const result = await updateTemplateDifficulty(
                templateId,
                questionType,
                difficulty
              )
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

    const typeLabel = QUESTION_TYPE_LABELS[questionType] || questionType

    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">
            Distribute <strong>{totalCount}</strong> {typeLabel} questions
            across difficulty levels.
          </p>
        </div>

        <div className="space-y-4">
          {DIFFICULTY_LEVELS.map(({ key, label, color }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${color}`} />
                  <Label htmlFor={`difficulty-${key}`}>{label}</Label>
                </div>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {difficulty[key]} / {totalCount}
                </span>
              </div>
              <Input
                id={`difficulty-${key}`}
                type="range"
                min={0}
                max={totalCount}
                value={difficulty[key]}
                onChange={(e) =>
                  handleChange(key, parseInt(e.target.value, 10))
                }
                disabled={isPending}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Distributed</span>
            <span
              className={`font-medium tabular-nums ${
                isValid
                  ? "text-emerald-600"
                  : distributed > totalCount
                    ? "text-red-600"
                    : "text-amber-600"
              }`}
            >
              {distributed} / {totalCount}
            </span>
          </div>
          <Progress value={progressPercent} />
          {!isValid && (
            <p className="text-muted-foreground text-xs">
              {distributed < totalCount
                ? `${totalCount - distributed} questions remaining to assign`
                : `${distributed - totalCount} questions over the limit`}
            </p>
          )}
        </div>
      </div>
    )
  }
)

DifficultyForm.displayName = "DifficultyForm"
