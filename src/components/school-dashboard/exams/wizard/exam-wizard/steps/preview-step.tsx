"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { createExamFromWizard } from "../actions"
import type { ExamWizardState, QuestionOption, TemplateOption } from "../types"

interface PreviewStepProps {
  lang: string
  state: ExamWizardState
  template: TemplateOption | null
  questions: QuestionOption[]
}

export function PreviewStep({
  lang,
  state,
  template,
  questions,
}: PreviewStepProps) {
  const router = useRouter()
  const isAr = lang === "ar"
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedQuestions = questions.filter((q) =>
    state.selectedQuestionIds.includes(q.id)
  )

  // Group selected questions by type
  const byType: Record<string, number> = {}
  const byDifficulty: Record<string, number> = {}
  const totalPoints = selectedQuestions.reduce((sum, q) => {
    byType[q.questionType] = (byType[q.questionType] || 0) + 1
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1
    return sum + q.points
  }, 0)

  const handleGenerate = async () => {
    setSaving(true)
    setError(null)

    try {
      const result = await createExamFromWizard({
        templateId: state.templateId!,
        examMode: state.examMode,
        existingExamId: state.existingExamId || undefined,
        newExamTitle: state.newExamTitle || undefined,
        newExamClassId: state.newExamClassId || undefined,
        newExamSubjectId: state.newExamSubjectId || undefined,
        newExamDate: state.newExamDate || undefined,
        newExamStartTime: state.newExamStartTime || undefined,
        newExamDuration: state.newExamDuration,
        newExamTotalMarks: state.newExamTotalMarks,
        newExamPassingMarks: state.newExamPassingMarks,
        questionIds: state.selectedQuestionIds,
        paperTemplate: state.paperTemplate,
        pageSize: state.pageSize,
        shuffleQuestions: state.shuffleQuestions,
        shuffleOptions: state.shuffleOptions,
        versionCount: state.versionCount,
        showSchoolLogo: state.showSchoolLogo,
        showInstructions: state.showInstructions,
        showPointsPerQuestion: state.showPointsPerQuestion,
      })

      if (result.success) {
        router.push(`/${lang}/exams/generate`)
      } else {
        setError(result.error || (isAr ? "فشل الإنشاء" : "Generation failed"))
      }
    } catch {
      setError(isAr ? "حدث خطأ" : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "مراجعة وإنشاء" : "Review & Generate"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "راجع الإعدادات قبل إنشاء الاختبار"
            : "Review settings before generating the exam"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Template info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "القالب" : "Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{template?.name || "—"}</p>
            {template && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {template.subjectName}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Exam info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "الاختبار" : "Exam"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {state.examMode === "new" ? (
              <>
                <p className="font-medium">{state.newExamTitle || "—"}</p>
                <p className="text-muted-foreground text-xs">
                  {state.newExamDate
                    ? new Date(state.newExamDate).toLocaleDateString(
                        isAr ? "ar" : "en"
                      )
                    : "—"}{" "}
                  | {state.newExamStartTime}
                </p>
                <p className="text-muted-foreground text-xs">
                  {state.newExamDuration} {isAr ? "دقيقة" : "min"} |{" "}
                  {state.newExamTotalMarks} {isAr ? "درجة" : "marks"}
                </p>
              </>
            ) : (
              <p className="font-medium">
                {isAr ? "اختبار موجود" : "Existing exam"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Question summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "الأسئلة" : "Questions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isAr ? "العدد" : "Total"}
              </span>
              <span className="font-medium">{selectedQuestions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isAr ? "الدرجات" : "Points"}
              </span>
              <span className="font-medium">{totalPoints}</span>
            </div>
            <div className="flex flex-wrap gap-1 border-t pt-1">
              {Object.entries(byType).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-[10px]">
                  {type.replace(/_/g, " ")}: {count}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(byDifficulty).map(([diff, count]) => (
                <Badge key={diff} variant="secondary" className="text-[10px]">
                  {diff}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Paper config */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "إعدادات الورقة" : "Paper Config"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isAr ? "النمط" : "Style"}
              </span>
              <Badge variant="secondary" className="text-xs">
                {state.paperTemplate}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isAr ? "الحجم" : "Size"}
              </span>
              <span>{state.pageSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isAr ? "النسخ" : "Versions"}
              </span>
              <span>{state.versionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isAr ? "خلط" : "Shuffle"}
              </span>
              <span>
                {state.shuffleQuestions
                  ? isAr
                    ? "نعم"
                    : "Yes"
                  : isAr
                    ? "لا"
                    : "No"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handleGenerate} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="me-2 h-4 w-4" />
        )}
        {isAr ? "إنشاء الاختبار" : "Generate Exam"}
      </Button>
    </div>
  )
}
