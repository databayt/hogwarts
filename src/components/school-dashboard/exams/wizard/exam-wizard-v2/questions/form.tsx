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
import { FileQuestion } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"

import { getAvailableQuestions, updateSelectedQuestions } from "./actions"

interface QuestionOption {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  points: number
}

interface QuestionsFormProps {
  generatedExamId: string
  subjectId?: string | null
  initialQuestionIds?: string[]
  onValidChange?: (isValid: boolean) => void
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HARD: "bg-red-100 text-red-800",
}

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "MCQ",
  TRUE_FALSE: "T/F",
  SHORT_ANSWER: "Short",
  ESSAY: "Essay",
  FILL_BLANK: "Fill",
  MATCHING: "Match",
  ORDERING: "Order",
  MULTI_SELECT: "Multi",
}

export const QuestionsForm = forwardRef<WizardFormRef, QuestionsFormProps>(
  ({ generatedExamId, subjectId, initialQuestionIds, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [questions, setQuestions] = useState<QuestionOption[]>([])
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
      new Set(initialQuestionIds || [])
    )

    // Load questions
    useEffect(() => {
      let mounted = true
      getAvailableQuestions(subjectId || undefined).then((result) => {
        if (!mounted) return
        if (result.success && result.data) {
          setQuestions(result.data)
        }
        setIsLoadingQuestions(false)
      })
      return () => {
        mounted = false
      }
    }, [subjectId])

    // Notify parent of validity
    useEffect(() => {
      onValidChange?.(selectedIds.size > 0)
    }, [selectedIds.size, onValidChange])

    const handleToggle = useCallback((questionId: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(questionId)) {
          next.delete(questionId)
        } else {
          next.add(questionId)
        }
        return next
      })
    }, [])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          if (selectedIds.size === 0) {
            ErrorToast("Select at least one question")
            reject(new Error("No questions selected"))
            return
          }
          startTransition(async () => {
            try {
              const result = await updateSelectedQuestions(
                generatedExamId,
                Array.from(selectedIds)
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

    if (isLoadingQuestions) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )
    }

    if (questions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileQuestion className="text-muted-foreground mb-4 h-10 w-10" />
          <p className="text-muted-foreground text-sm">
            No questions available. Add questions to the Question Bank first.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            {selectedIds.size} of {questions.length} selected
          </span>
        </div>
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                selectedIds.has(q.id)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              } ${isPending ? "pointer-events-none opacity-50" : ""}`}
              onClick={() => handleToggle(q.id)}
            >
              <Checkbox
                checked={selectedIds.has(q.id)}
                onCheckedChange={() => handleToggle(q.id)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm">{q.questionText}</p>
                <div className="mt-1 flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[q.questionType] || q.questionType}
                  </Badge>
                  <Badge
                    className={`text-xs ${DIFFICULTY_COLORS[q.difficulty] || ""}`}
                    variant="secondary"
                  >
                    {q.difficulty}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {q.points} pts
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

QuestionsForm.displayName = "QuestionsForm"
