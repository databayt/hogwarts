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

import { Input } from "@/components/ui/input"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import type { QuestionTypeConfig } from "../../types"
import {
  commonLabels,
  difficultyTableLabels,
  QUESTION_TYPE_LABELS,
} from "../labels"
import { updateTemplateAllDifficulties } from "./actions"

interface DifficultyRow {
  type: string
  EASY: number
  MEDIUM: number
  HARD: number
}

interface DifficultyFormProps {
  templateId: string
  initialData: QuestionTypeConfig[]
  onValidChange?: (isValid: boolean) => void
}

const LEVELS = ["EASY", "MEDIUM", "HARD"] as const

export const DifficultyForm = forwardRef<WizardFormRef, DifficultyFormProps>(
  ({ templateId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { locale } = useLocale()
    const lang = locale === "ar" ? "ar" : "en"

    const [rows, setRows] = useState<DifficultyRow[]>(() =>
      initialData.map((qt) => ({
        type: qt.type,
        EASY: qt.difficulty.EASY,
        MEDIUM: qt.difficulty.MEDIUM,
        HARD: qt.difficulty.HARD,
      }))
    )

    const total = (r: DifficultyRow) => r.EASY + r.MEDIUM + r.HARD
    const isValid = rows.length > 0 && rows.every((r) => total(r) >= 1)

    useEffect(() => {
      onValidChange?.(isValid)
    }, [isValid, onValidChange])

    const handleChange = useCallback(
      (type: string, level: (typeof LEVELS)[number], value: number) => {
        setRows((curr) =>
          curr.map((r) =>
            r.type === type
              ? { ...r, [level]: Math.max(0, Math.floor(value) || 0) }
              : r
          )
        )
      },
      []
    )

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              if (!isValid) {
                reject(new Error("Validation failed"))
                return
              }
              const distribution: Record<
                string,
                { EASY: number; MEDIUM: number; HARD: number }
              > = {}
              for (const r of rows) {
                distribution[r.type] = {
                  EASY: r.EASY,
                  MEDIUM: r.MEDIUM,
                  HARD: r.HARD,
                }
              }
              const result = await updateTemplateAllDifficulties(templateId, {
                distribution,
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

    if (rows.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          {difficultyTableLabels.noTypes[lang]}
        </p>
      )
    }

    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs">
          {difficultyTableLabels.hint[lang]}
        </p>

        {/* Header */}
        <div className="text-muted-foreground grid grid-cols-[1fr_3rem_3rem_3rem_2.5rem] items-center gap-2 px-1 text-xs font-medium">
          <span>{difficultyTableLabels.type[lang]}</span>
          <span className="text-center">
            {difficultyTableLabels.easy[lang]}
          </span>
          <span className="text-center">
            {difficultyTableLabels.medium[lang]}
          </span>
          <span className="text-center">
            {difficultyTableLabels.hard[lang]}
          </span>
          <span className="text-center">
            {difficultyTableLabels.total[lang]}
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.type}
              className="grid grid-cols-[1fr_3rem_3rem_3rem_2.5rem] items-center gap-2 rounded-lg border p-2"
            >
              <span className="truncate text-sm font-medium">
                {QUESTION_TYPE_LABELS[r.type]?.[lang] || r.type}
              </span>
              {LEVELS.map((level) => (
                <Input
                  key={level}
                  type="number"
                  min={0}
                  value={r[level]}
                  onChange={(e) =>
                    handleChange(r.type, level, Number(e.target.value))
                  }
                  disabled={isPending}
                  className="h-8 px-1 text-center text-sm"
                  aria-label={`${QUESTION_TYPE_LABELS[r.type]?.[lang] || r.type} ${difficultyTableLabels[level === "EASY" ? "easy" : level === "MEDIUM" ? "medium" : "hard"][lang]}`}
                />
              ))}
              <span className="text-center text-sm font-semibold tabular-nums">
                {total(r)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

DifficultyForm.displayName = "DifficultyForm"
