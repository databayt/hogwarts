"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Prisma } from "@prisma/client"
import { Check, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WizardStep } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { FullPaperMockup } from "../../atoms"
import { saveTemplate } from "../actions"
import { getStepLabel, QUESTION_TYPE_LABELS, t } from "../labels"
import { useTemplateWizard } from "../use-template-wizard"
import { completeTemplateWizard } from "../wizard-actions"

export default function PreviewContent() {
  const { locale } = useLocale()
  const params = useParams()
  const templateId = params.id as string
  const router = useRouter()
  const { data, isLoading } = useTemplateWizard()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = React.useRef(null)

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    setError(null)

    try {
      // Build distribution from questionTypes
      const distribution: Record<string, Record<string, number>> = {}
      for (const qt of data.questionTypes) {
        distribution[qt.type] = {
          EASY: qt.difficulty.EASY,
          MEDIUM: qt.difficulty.MEDIUM,
          HARD: qt.difficulty.HARD,
        }
      }

      const result = await saveTemplate({
        id: templateId,
        name: data.name,
        description: data.description || undefined,
        subjectId: data.subjectId,
        duration: data.duration,
        totalMarks: data.totalMarks,
        distribution,
        blockConfig: {
          slots: {
            header: data.headerVariant,
            footer: data.footerVariant,
            studentInfo: data.studentInfoVariant,
            instructions: data.instructionsVariant,
            answerSheet: data.answerSheetVariant,
            cover: data.coverVariant,
          },
          decorations: JSON.parse(JSON.stringify(data.decorations)),
          selectedPresetId: data.selectedPresetId,
        } as unknown as Prisma.InputJsonValue,
        scoringConfig: {
          passingScore: data.passingScore,
          gradeBoundaries: JSON.parse(JSON.stringify(data.gradeBoundaries)),
        } as unknown as Prisma.InputJsonValue,
        printConfig: {
          pageSize: data.pageSize,
          orientation: data.orientation,
          answerSheetType: data.answerSheetType,
          layout: data.layout,
        } as unknown as Prisma.InputJsonValue,
      })

      if (result.success) {
        // Mark wizard as complete
        await completeTemplateWizard(templateId)
        const lang = params.lang as string
        router.push(`/${lang}/exams/generate`)
      } else {
        setError(result.error || "Failed to save")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (!data) return null

  const totalQuestions = data.questionTypes.reduce(
    (sum, qt) => sum + qt.count,
    0
  )

  return (
    <WizardStep
      entityId={templateId}
      isValid={true}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {getStepLabel("preview", "title", locale)}
          </h1>
          <p className="text-muted-foreground text-sm">
            {getStepLabel("preview", "description", locale)}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
          {/* Summary cards */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("basicInfo", locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("name", locale)}
                    </span>
                    <span className="font-medium">{data.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("duration", locale)}
                    </span>
                    <span>
                      {data.duration} {t("min", locale)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("marks", locale)}
                    </span>
                    <span>{data.totalMarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("questions", locale)}
                    </span>
                    <span>{totalQuestions}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("paperLayout", locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("header", locale)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {data.headerVariant}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("footer", locale)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {data.footerVariant}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("studentInfo", locale)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {data.studentInfoVariant}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("instructions", locale)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {data.instructionsVariant}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("scoring", locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("passing", locale)}
                    </span>
                    <span>{data.passingScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("grades", locale)}
                    </span>
                    <span>{data.gradeBoundaries.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {data.gradeBoundaries.slice(0, 5).map((b, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        {b.label}: {b.minPercent}%
                      </Badge>
                    ))}
                    {data.gradeBoundaries.length > 5 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{data.gradeBoundaries.length - 5}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("printSettings", locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("size", locale)}
                    </span>
                    <span>{data.pageSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("orientation", locale)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {data.orientation}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("layout", locale)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {data.layout.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Question distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("questionDistribution", locale)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.questionTypes.map((qt) => (
                    <div
                      key={qt.type}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {QUESTION_TYPE_LABELS[qt.type]?.[
                          locale === "ar" ? "ar" : "en"
                        ] || qt.type.replace(/_/g, " ")}
                      </span>
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

          {/* Paper mockup */}
          <div className="hidden lg:block">
            <p className="text-muted-foreground mb-2 text-xs">
              {t("preview", locale)}
            </p>
            <FullPaperMockup
              headerVariant={data.headerVariant}
              studentInfoVariant={data.studentInfoVariant}
              instructionsVariant={data.instructionsVariant}
              footerVariant={data.footerVariant}
              className="sticky top-4"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="me-2 h-4 w-4" />
          )}
          {t("saveTemplate", locale)}
        </Button>
      </div>
    </WizardStep>
  )
}
