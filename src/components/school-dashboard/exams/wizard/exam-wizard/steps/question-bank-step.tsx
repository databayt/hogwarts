"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { ExamWizardAction, QuestionOption, TemplateOption } from "../types"

interface QuestionBankStepProps {
  lang: string
  questions: QuestionOption[]
  selectedIds: string[]
  template: TemplateOption | null
  autoFilled: boolean
  dispatch: React.Dispatch<ExamWizardAction>
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  HARD: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function QuestionBankStep({
  lang,
  questions,
  selectedIds,
  template,
  autoFilled,
  dispatch,
}: QuestionBankStepProps) {
  const isAr = lang === "ar"
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all")

  // Auto-fill on first mount if template is selected and not yet auto-filled
  const autoFillQuestions = useCallback(() => {
    if (!template || autoFilled || questions.length === 0) return

    const selected: string[] = []

    // For each question type + difficulty bucket in the template distribution
    for (const [qType, difficulties] of Object.entries(template.distribution)) {
      for (const [difficulty, count] of Object.entries(
        difficulties as Record<string, number>
      )) {
        // Find matching questions not yet selected
        const matching = questions.filter(
          (q) =>
            q.questionType === qType &&
            q.difficulty === difficulty &&
            !selected.includes(q.id)
        )
        // Take up to `count` questions
        const take = matching.slice(0, count)
        selected.push(...take.map((q) => q.id))
      }
    }

    dispatch({ type: "SET_QUESTIONS", payload: selected })
    dispatch({ type: "SET_AUTO_FILLED", payload: true })
  }, [template, autoFilled, questions, dispatch])

  useEffect(() => {
    autoFillQuestions()
  }, [autoFillQuestions])

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (
        search &&
        !q.questionText.toLowerCase().includes(search.toLowerCase())
      ) {
        return false
      }
      if (filterType !== "all" && q.questionType !== filterType) {
        return false
      }
      if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) {
        return false
      }
      return true
    })
  }, [questions, search, filterType, filterDifficulty])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const toggleQuestion = (id: string) => {
    const next = selectedSet.has(id)
      ? selectedIds.filter((qId) => qId !== id)
      : [...selectedIds, id]
    dispatch({ type: "SET_QUESTIONS", payload: next })
  }

  const selectAll = () => {
    const allIds = filteredQuestions.map((q) => q.id)
    const merged = [...new Set([...selectedIds, ...allIds])]
    dispatch({ type: "SET_QUESTIONS", payload: merged })
  }

  const deselectAll = () => {
    const filteredIds = new Set(filteredQuestions.map((q) => q.id))
    const remaining = selectedIds.filter((id) => !filteredIds.has(id))
    dispatch({ type: "SET_QUESTIONS", payload: remaining })
  }

  // Distribution check against template
  const distributionWarnings = useMemo(() => {
    if (!template) return []
    const warnings: string[] = []

    for (const [qType, difficulties] of Object.entries(template.distribution)) {
      for (const [difficulty, needed] of Object.entries(
        difficulties as Record<string, number>
      )) {
        const have = questions.filter(
          (q) =>
            selectedSet.has(q.id) &&
            q.questionType === qType &&
            q.difficulty === difficulty
        ).length
        if (have < needed) {
          warnings.push(
            `${qType.replace(/_/g, " ")} ${difficulty}: ${have}/${needed}`
          )
        }
      }
    }
    return warnings
  }, [template, questions, selectedSet])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "بنك الأسئلة" : "Question Bank"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "تم التعبئة التلقائية من القالب. يمكنك تعديل الاختيار."
            : "Auto-filled from template. You can adjust the selection."}
        </p>
      </div>

      {/* Distribution warnings */}
      {distributionWarnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <div className="text-xs">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              {isAr ? "نقص في الأسئلة" : "Question shortfall"}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {distributionWarnings.map((w) => (
                <Badge key={w} variant="outline" className="text-[10px]">
                  {w}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={isAr ? "بحث..." : "Search..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {isAr ? "جميع الأنواع" : "All Types"}
            </SelectItem>
            <SelectItem value="MULTIPLE_CHOICE">MCQ</SelectItem>
            <SelectItem value="TRUE_FALSE">True/False</SelectItem>
            <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
            <SelectItem value="ESSAY">Essay</SelectItem>
            <SelectItem value="FILL_BLANK">Fill Blank</SelectItem>
            <SelectItem value="MATCHING">Matching</SelectItem>
            <SelectItem value="ORDERING">Ordering</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {isAr ? "جميع المستويات" : "All Levels"}
            </SelectItem>
            <SelectItem value="EASY">{isAr ? "سهل" : "Easy"}</SelectItem>
            <SelectItem value="MEDIUM">{isAr ? "متوسط" : "Medium"}</SelectItem>
            <SelectItem value="HARD">{isAr ? "صعب" : "Hard"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {selectedIds.length} {isAr ? "مختار" : "selected"} /{" "}
          {filteredQuestions.length} {isAr ? "متاح" : "available"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            {isAr ? "تحديد الكل" : "Select All"}
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            {isAr ? "إلغاء الكل" : "Deselect All"}
          </Button>
          {template && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dispatch({ type: "SET_AUTO_FILLED", payload: false })
                dispatch({ type: "SET_QUESTIONS", payload: [] })
                // Will trigger auto-fill again
                setTimeout(() => {
                  dispatch({ type: "SET_AUTO_FILLED", payload: false })
                }, 0)
              }}
            >
              <Sparkles className="me-1 h-3 w-3" />
              {isAr ? "تعبئة تلقائية" : "Auto-Fill"}
            </Button>
          )}
        </div>
      </div>

      {/* Question list */}
      <div className="max-h-[400px] space-y-1 overflow-y-auto">
        {filteredQuestions.map((q) => {
          const isSelected = selectedSet.has(q.id)
          return (
            <div
              key={q.id}
              className={`flex items-start gap-3 rounded-md border p-3 transition ${
                isSelected
                  ? "border-primary/30 bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleQuestion(q.id)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm">{q.questionText}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {q.questionType.replace(/_/g, " ")}
                  </Badge>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      DIFFICULTY_COLORS[q.difficulty] || ""
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {q.points} {isAr ? "د" : "pts"}
                  </Badge>
                </div>
              </div>
              {isSelected && (
                <Check className="text-primary h-4 w-4 shrink-0" />
              )}
            </div>
          )
        })}
        {filteredQuestions.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {isAr
              ? "لم يتم العثور على أسئلة"
              : "No questions found matching filters"}
          </p>
        )}
      </div>
    </div>
  )
}
