"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

import { useWizard } from "../../context/wizard-provider"

interface QuestionTypeStepProps {
  lang: string
  questionTypeIndex: number
}

const QUESTION_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  MULTIPLE_CHOICE: { en: "Multiple Choice", ar: "اختيار متعدد" },
  TRUE_FALSE: { en: "True / False", ar: "صح / خطأ" },
  SHORT_ANSWER: { en: "Short Answer", ar: "إجابة قصيرة" },
  ESSAY: { en: "Essay", ar: "مقال" },
  FILL_BLANK: { en: "Fill in the Blank", ar: "أكمل الفراغ" },
  MATCHING: { en: "Matching", ar: "مطابقة" },
  ORDERING: { en: "Ordering", ar: "ترتيب" },
}

const DIFFICULTY_LABELS = {
  EASY: { en: "Easy", ar: "سهل", color: "bg-emerald-500" },
  MEDIUM: { en: "Medium", ar: "متوسط", color: "bg-amber-500" },
  HARD: { en: "Hard", ar: "صعب", color: "bg-red-500" },
}

export function QuestionTypeStep({
  lang,
  questionTypeIndex,
}: QuestionTypeStepProps) {
  const { state, dispatch } = useWizard()
  const isAr = lang === "ar"

  const config = state.questionTypes[questionTypeIndex]
  if (!config) return null

  const typeLabel =
    QUESTION_TYPE_LABELS[config.type]?.[isAr ? "ar" : "en"] || config.type
  const totalDistributed =
    config.difficulty.EASY + config.difficulty.MEDIUM + config.difficulty.HARD
  const remaining = config.count - totalDistributed

  const updateDifficulty = (
    level: "EASY" | "MEDIUM" | "HARD",
    value: number
  ) => {
    const newTypes = [...state.questionTypes]
    newTypes[questionTypeIndex] = {
      ...config,
      difficulty: {
        ...config.difficulty,
        [level]: Math.max(0, value),
      },
    }
    dispatch({ type: "SET_QUESTION_TYPES", payload: newTypes })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{typeLabel}</h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? `وزع ${config.count} أسئلة حسب مستوى الصعوبة`
            : `Distribute ${config.count} questions by difficulty level`}
        </p>
      </div>

      {/* Total count */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isAr ? "إجمالي الأسئلة" : "Total Questions"}
          </span>
          <span className="text-lg font-bold">{config.count}</span>
        </div>
        <Progress
          value={(totalDistributed / config.count) * 100}
          className="mt-2 h-2"
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-muted-foreground">
            {isAr ? "موزع" : "Distributed"}: {totalDistributed}
          </span>
          {remaining !== 0 && (
            <span className={remaining > 0 ? "text-amber-600" : "text-red-600"}>
              {remaining > 0
                ? isAr
                  ? `${remaining} متبقي`
                  : `${remaining} remaining`
                : isAr
                  ? `${Math.abs(remaining)} زائد`
                  : `${Math.abs(remaining)} over`}
            </span>
          )}
        </div>
      </div>

      {/* Difficulty sliders */}
      <div className="space-y-4">
        {(["EASY", "MEDIUM", "HARD"] as const).map((level) => {
          const label = DIFFICULTY_LABELS[level]
          return (
            <div key={level} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${label.color}`} />
                  {label[isAr ? "ar" : "en"]}
                </Label>
                <span className="text-muted-foreground text-sm">
                  {config.difficulty[level]} / {config.count}
                </span>
              </div>
              <Input
                type="range"
                min={0}
                max={config.count}
                value={config.difficulty[level]}
                onChange={(e) =>
                  updateDifficulty(level, parseInt(e.target.value))
                }
                className="h-2"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
