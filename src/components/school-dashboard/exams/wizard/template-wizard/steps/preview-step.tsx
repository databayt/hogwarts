"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Prisma } from "@prisma/client"
import { Check, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { FullPaperMockup } from "../../atoms"
import { useWizard } from "../../context/wizard-provider"
import { saveTemplate } from "../actions"

interface PreviewStepProps {
  lang: string
  schoolId: string
}

export function PreviewStep({ lang, schoolId }: PreviewStepProps) {
  const { state, clearDraft } = useWizard()
  const router = useRouter()
  const isAr = lang === "ar"
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Build distribution from question types
  const distribution: Record<string, Record<string, number>> = {}
  for (const qt of state.questionTypes) {
    distribution[qt.type] = {
      EASY: qt.difficulty.EASY,
      MEDIUM: qt.difficulty.MEDIUM,
      HARD: qt.difficulty.HARD,
    }
  }

  const totalQuestions = state.questionTypes.reduce(
    (sum, qt) => sum + qt.count,
    0
  )

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const result = await saveTemplate({
        id: state.existingTemplateId || undefined,
        name: state.name,
        description: state.description || undefined,
        subjectId: state.subjectIds[0] || "",
        duration: state.duration,
        totalMarks: state.totalMarks,
        distribution,
        blockConfig: {
          slots: {
            header: state.headerVariant,
            footer: state.footerVariant,
            studentInfo: state.studentInfoVariant,
            instructions: state.instructionsVariant,
            answerSheet: state.answerSheetVariant,
            cover: state.coverVariant,
          },
          decorations: JSON.parse(JSON.stringify(state.decorations)),
        } as unknown as Prisma.InputJsonValue,
        scoringConfig: {
          passingScore: state.passingScore,
          gradeBoundaries: JSON.parse(JSON.stringify(state.gradeBoundaries)),
        } as unknown as Prisma.InputJsonValue,
        printConfig: {
          pageSize: state.pageSize,
          orientation: state.orientation,
          answerSheetType: state.answerSheetType,
          layout: state.layout,
        } as unknown as Prisma.InputJsonValue,
      })

      if (result.success) {
        clearDraft()
        router.push(`/${lang}/exams/generate`)
      } else {
        setError(result.error || (isAr ? "فشل الحفظ" : "Failed to save"))
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
          {isAr ? "مراجعة ومعاينة" : "Review & Preview"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "راجع إعدادات القالب قبل الحفظ"
            : "Review your template settings before saving"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
        {/* Summary cards */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isAr ? "معلومات أساسية" : "Basic Info"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "الاسم" : "Name"}
                  </span>
                  <span className="font-medium">{state.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "المدة" : "Duration"}
                  </span>
                  <span>
                    {state.duration} {isAr ? "دقيقة" : "min"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "الدرجة" : "Marks"}
                  </span>
                  <span>{state.totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "الأسئلة" : "Questions"}
                  </span>
                  <span>{totalQuestions}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isAr ? "تخطيط الورقة" : "Paper Layout"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "ترويسة" : "Header"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {state.headerVariant}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "تذييل" : "Footer"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {state.footerVariant}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "بيانات الطالب" : "Student Info"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {state.studentInfoVariant}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "تعليمات" : "Instructions"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {state.instructionsVariant}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Scoring summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isAr ? "الدرجات" : "Scoring"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "درجة النجاح" : "Passing"}
                  </span>
                  <span>{state.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "التقديرات" : "Grades"}
                  </span>
                  <span>{state.gradeBoundaries.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {state.gradeBoundaries.slice(0, 5).map((b, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {b.label}: {b.minPercent}%
                    </Badge>
                  ))}
                  {state.gradeBoundaries.length > 5 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{state.gradeBoundaries.length - 5}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Print config summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isAr ? "إعدادات الطباعة" : "Print Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "الحجم" : "Size"}
                  </span>
                  <span>{state.pageSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "الاتجاه" : "Orientation"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {state.orientation}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "التخطيط" : "Layout"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {state.layout.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question type breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isAr ? "توزيع الأسئلة" : "Question Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {state.questionTypes.map((qt) => (
                  <div
                    key={qt.type}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{qt.type.replace(/_/g, " ")}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        E:{qt.difficulty.EASY}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        M:{qt.difficulty.MEDIUM}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        H:{qt.difficulty.HARD}
                      </Badge>
                      <span className="font-medium">= {qt.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Paper mockup preview */}
        <div className="hidden lg:block">
          <p className="text-muted-foreground mb-2 text-xs">
            {isAr ? "معاينة" : "Preview"}
          </p>
          <FullPaperMockup
            headerVariant={state.headerVariant}
            studentInfoVariant={state.studentInfoVariant}
            instructionsVariant={state.instructionsVariant}
            footerVariant={state.footerVariant}
            className="sticky top-4"
          />
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Save button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="me-2 h-4 w-4" />
        )}
        {state.existingTemplateId
          ? isAr
            ? "تحديث القالب"
            : "Update Template"
          : isAr
            ? "حفظ القالب"
            : "Save Template"}
      </Button>
    </div>
  )
}
