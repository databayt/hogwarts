// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

/**
 * Quick Paper Button
 *
 * Provides a one-click "Generate Paper" action on the exam detail page.
 * If a GeneratedExam already exists, navigates directly to the paper config page.
 * Otherwise, creates a GeneratedExam (pulling questions from the exam's QuestionBank)
 * and then navigates.
 */
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { createGeneratedExamForPaper } from "./actions/quick-paper"

// ============================================================================
// Types
// ============================================================================

interface QuickPaperButtonProps {
  examId: string
  subdomain: string
  locale: "en" | "ar"
  existingGeneratedExamId?: string
}

// ============================================================================
// Labels
// ============================================================================

const LABELS = {
  en: {
    generatePaper: "Generate Paper",
    viewPaper: "View Paper",
    generating: "Generating...",
    errorTitle: "Paper Generation Failed",
    noQuestions:
      "No questions found in the question bank for this exam's subject. Add questions first.",
  },
  ar: {
    generatePaper: "إنشاء ورقة",
    viewPaper: "عرض الورقة",
    generating: "جاري الإنشاء...",
    errorTitle: "فشل إنشاء الورقة",
    noQuestions:
      "لم يتم العثور على أسئلة في بنك الأسئلة لمادة هذا الاختبار. أضف أسئلة أولاً.",
  },
} as const

// ============================================================================
// Component
// ============================================================================

export function QuickPaperButton({
  examId,
  subdomain,
  locale,
  existingGeneratedExamId,
}: QuickPaperButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const labels = LABELS[locale]

  const paperPath = (generatedExamId: string) =>
    `/${locale}/s/${subdomain}/exams/paper/${generatedExamId}`

  const handleClick = () => {
    // If a generated exam already exists, navigate directly
    if (existingGeneratedExamId) {
      router.push(paperPath(existingGeneratedExamId))
      return
    }

    // Otherwise, create a GeneratedExam then navigate
    startTransition(async () => {
      const result = await createGeneratedExamForPaper(examId)

      if (!result.success) {
        toast.error(labels.errorTitle, {
          description: result.error,
        })
        return
      }

      if (!result.data) {
        toast.error(labels.errorTitle, {
          description: "No data returned from server",
        })
        return
      }

      router.push(paperPath(result.data.generatedExamId))
    })
  }

  return (
    <Button onClick={handleClick} disabled={isPending} variant="default">
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {isPending
        ? labels.generating
        : existingGeneratedExamId
          ? labels.viewPaper
          : labels.generatePaper}
    </Button>
  )
}
