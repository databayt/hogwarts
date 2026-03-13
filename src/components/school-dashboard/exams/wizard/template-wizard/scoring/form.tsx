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
import { Plus, RotateCcw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"

import { getTier, GradeRow } from "../../atoms"
import type { GradeBoundary } from "../../types"
import { DEFAULT_GRADE_BOUNDARIES } from "../../types"
import { updateTemplateScoring } from "./actions"

interface ScoringFormProps {
  templateId: string
  initialData?: {
    passingScore: number
    gradeBoundaries: GradeBoundary[]
  }
  onValidChange?: (isValid: boolean) => void
}

export const ScoringForm = forwardRef<WizardFormRef, ScoringFormProps>(
  ({ templateId, initialData, onValidChange }, ref) => {
    const [passingScore, setPassingScore] = useState(
      initialData?.passingScore ?? 50
    )
    const [gradeBoundaries, setGradeBoundaries] = useState<GradeBoundary[]>(
      initialData?.gradeBoundaries ?? DEFAULT_GRADE_BOUNDARIES
    )
    const [, startTransition] = useTransition()

    useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    useEffect(() => {
      if (initialData) {
        setPassingScore(initialData.passingScore)
        setGradeBoundaries(initialData.gradeBoundaries)
      }
    }, [initialData])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const result = await updateTemplateScoring(templateId, {
                passingScore,
                gradeBoundaries,
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

    const updateBoundary = useCallback(
      (index: number, field: keyof GradeBoundary, value: string | number) => {
        setGradeBoundaries((curr) => {
          const updated = [...curr]
          updated[index] = { ...updated[index], [field]: value }
          return updated
        })
      },
      []
    )

    const addBoundary = useCallback(() => {
      setGradeBoundaries((curr) => {
        const last = curr[curr.length - 1]
        const newMin = Math.max(0, (last?.minPercent ?? 50) - 10)
        return [...curr, { label: "", minPercent: newMin }]
      })
    }, [])

    const removeBoundary = useCallback((index: number) => {
      setGradeBoundaries((curr) => curr.filter((_, i) => i !== index))
    }, [])

    const resetToDefaults = useCallback(() => {
      setPassingScore(50)
      setGradeBoundaries(DEFAULT_GRADE_BOUNDARIES)
    }, [])

    // Visual bar showing grade bands
    const maxPercent = 100
    const sortedBoundaries = [...gradeBoundaries].sort(
      (a, b) => b.minPercent - a.minPercent
    )

    return (
      <div className="space-y-6">
        {/* Passing score */}
        <div className="space-y-2">
          <Label htmlFor="passing-score">Passing Score (%)</Label>
          <Input
            id="passing-score"
            type="number"
            min={0}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value))}
            className="w-32"
          />
        </div>

        {/* Visual grade bar */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Grade Distribution</p>
          <div className="flex h-6 overflow-hidden rounded-md">
            {sortedBoundaries.map((b, i) => {
              const nextMin = sortedBoundaries[i + 1]?.minPercent ?? 0
              const width = b.minPercent - nextMin
              if (width <= 0) return null
              const tier = getTier(b.minPercent)
              const bgMap = {
                excellent: "bg-emerald-400 dark:bg-emerald-600",
                good: "bg-blue-400 dark:bg-blue-600",
                average: "bg-amber-400 dark:bg-amber-600",
                failing: "bg-red-400 dark:bg-red-600",
              }
              return (
                <div
                  key={i}
                  className={`${bgMap[tier]} flex items-center justify-center text-[9px] font-medium text-white`}
                  style={{ width: `${(width / maxPercent) * 100}%` }}
                  title={`${b.label}: ${b.minPercent}%+`}
                >
                  {width >= 8 && b.label}
                </div>
              )
            })}
          </div>
        </div>

        {/* Grade boundaries */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Grade Boundaries</p>
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="me-1 h-3 w-3" />
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            {gradeBoundaries.map((boundary, index) => (
              <GradeRow key={index} tier={getTier(boundary.minPercent)}>
                <Input
                  value={boundary.label}
                  onChange={(e) =>
                    updateBoundary(index, "label", e.target.value)
                  }
                  className="h-7 w-16 text-center text-sm font-medium"
                  placeholder="A+"
                />
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-muted-foreground text-xs">Min %</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={boundary.minPercent}
                    onChange={(e) =>
                      updateBoundary(
                        index,
                        "minPercent",
                        Number(e.target.value)
                      )
                    }
                    className="h-7 w-20 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBoundary(index)}
                  className="h-7 w-7 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </GradeRow>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addBoundary}>
            <Plus className="me-1 h-3 w-3" />
            Add Grade
          </Button>
        </div>
      </div>
    )
  }
)
ScoringForm.displayName = "ScoringForm"
