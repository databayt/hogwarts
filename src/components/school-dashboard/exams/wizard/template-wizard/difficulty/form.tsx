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
import { useLocale } from "@/components/internationalization/use-locale"

import {
  commonLabels,
  difficultyLabels,
  QUESTION_TYPE_LABELS,
} from "../labels"
import { updateTemplateDifficulty } from "./actions"

const DIFFICULTY_LEVELS = [
  { key: "EASY" as const, color: "bg-emerald-500" },
  { key: "MEDIUM" as const, color: "bg-amber-500" },
  { key: "HARD" as const, color: "bg-red-500" },
] as const

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
    const { locale } = useLocale()
    const lang = locale === "ar" ? "ar" : "en"
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
                  `${difficultyLabels.mustEqualPrefix[lang]} ${totalCount} (${difficultyLabels.currently[lang]} ${distributed})`
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

    const typeLabel =
      QUESTION_TYPE_LABELS[questionType]?.[lang] || questionType

    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">
            {difficultyLabels.distributePrefix[lang]}{" "}
            <strong>{totalCount}</strong> {typeLabel}{" "}
            {difficultyLabels.distributeSuffix[lang]}
          </p>
        </div>

        <div className="space-y-4">
          {DIFFICULTY_LEVELS.map(({ key, color }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${color}`} />
                  <Label htmlFor={`difficulty-${key}`}>
                    {difficultyLabels.levels[key][lang]}
                  </Label>
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
            <span className="text-muted-foreground">
              {difficultyLabels.distributed[lang]}
            </span>
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
                ? `${totalCount - distributed} ${difficultyLabels.remaining[lang]}`
                : `${distributed - totalCount} ${difficultyLabels.overLimit[lang]}`}
            </p>
          )}
        </div>
      </div>
    )
  }
)

DifficultyForm.displayName = "DifficultyForm"
