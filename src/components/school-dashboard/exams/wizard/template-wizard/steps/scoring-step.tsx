"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback } from "react"
import { Plus, RotateCcw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { getTier, GradeRow } from "../../atoms"
import { useWizard } from "../../context/wizard-provider"
import { DEFAULT_GRADE_BOUNDARIES, type GradeBoundary } from "../../types"

interface ScoringStepProps {
  lang: string
}

export function ScoringStep({ lang }: ScoringStepProps) {
  const { state, dispatch } = useWizard()
  const isAr = lang === "ar"

  const updateBoundary = useCallback(
    (index: number, field: keyof GradeBoundary, value: string | number) => {
      const updated = [...state.gradeBoundaries]
      updated[index] = { ...updated[index], [field]: value }
      dispatch({
        type: "SET_SCORING",
        payload: { gradeBoundaries: updated },
      })
    },
    [state.gradeBoundaries, dispatch]
  )

  const addBoundary = useCallback(() => {
    const last = state.gradeBoundaries[state.gradeBoundaries.length - 1]
    const newMin = Math.max(0, (last?.minPercent ?? 50) - 10)
    dispatch({
      type: "SET_SCORING",
      payload: {
        gradeBoundaries: [
          ...state.gradeBoundaries,
          { label: "", minPercent: newMin },
        ],
      },
    })
  }, [state.gradeBoundaries, dispatch])

  const removeBoundary = useCallback(
    (index: number) => {
      dispatch({
        type: "SET_SCORING",
        payload: {
          gradeBoundaries: state.gradeBoundaries.filter((_, i) => i !== index),
        },
      })
    },
    [state.gradeBoundaries, dispatch]
  )

  const resetToDefaults = useCallback(() => {
    dispatch({
      type: "SET_SCORING",
      payload: {
        passingScore: 50,
        gradeBoundaries: DEFAULT_GRADE_BOUNDARIES,
      },
    })
  }, [dispatch])

  // Visual bar showing grade bands
  const maxPercent = 100
  const sortedBoundaries = [...state.gradeBoundaries].sort(
    (a, b) => b.minPercent - a.minPercent
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "الدرجات والتقديرات" : "Scoring & Grades"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "حدد درجة النجاح وحدود التقديرات"
            : "Set the passing score and grade boundaries"}
        </p>
      </div>

      {/* Passing score */}
      <div className="space-y-2">
        <Label htmlFor="passing-score">
          {isAr ? "درجة النجاح (%)" : "Passing Score (%)"}
        </Label>
        <Input
          id="passing-score"
          type="number"
          min={0}
          max={100}
          value={state.passingScore}
          onChange={(e) =>
            dispatch({
              type: "SET_SCORING",
              payload: { passingScore: Number(e.target.value) },
            })
          }
          className="w-32"
        />
      </div>

      {/* Visual grade bar */}
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {isAr ? "توزيع التقديرات" : "Grade Distribution"}
        </p>
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
          <p className="text-sm font-medium">
            {isAr ? "حدود التقديرات" : "Grade Boundaries"}
          </p>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="me-1 h-3 w-3" />
            {isAr ? "إعادة تعيين" : "Reset"}
          </Button>
        </div>

        <div className="space-y-2">
          {state.gradeBoundaries.map((boundary, index) => (
            <GradeRow key={index} tier={getTier(boundary.minPercent)}>
              <Input
                value={boundary.label}
                onChange={(e) => updateBoundary(index, "label", e.target.value)}
                className="h-7 w-16 text-center text-sm font-medium"
                placeholder="A+"
              />
              <div className="flex flex-1 items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {isAr ? "الحد الأدنى" : "Min"} %
                </span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={boundary.minPercent}
                  onChange={(e) =>
                    updateBoundary(index, "minPercent", Number(e.target.value))
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
          {isAr ? "إضافة تقدير" : "Add Grade"}
        </Button>
      </div>
    </div>
  )
}
