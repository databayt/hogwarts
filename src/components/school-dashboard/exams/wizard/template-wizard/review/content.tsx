"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Prisma } from "@prisma/client"
import { Check, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WizardStep } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { saveTemplate } from "../actions"
import {
  commonLabels,
  EXAM_TYPE_LABELS,
  getStepLabel,
  QUESTION_TYPE_LABELS,
  reviewLabels,
  t,
} from "../labels"
import { useTemplateWizard } from "../use-template-wizard"
import { completeTemplateWizard } from "../wizard-actions"

interface Props {
  /** Static-dictionary slice (generate.wizard.*) — falls back to local labels */
  dictionary?: { title?: string; description?: string }
}

export default function ReviewContent({ dictionary }: Props) {
  const { locale } = useLocale()
  const lang = locale === "ar" ? "ar" : "en"
  const params = useParams()
  const templateId = params.id as string
  const router = useRouter()
  const { data, isLoading } = useTemplateWizard()
  const formRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passingScore, setPassingScore] = useState<number>(
    data?.passingScore ?? 50
  )

  React.useEffect(() => {
    if (data) setPassingScore(data.passingScore)
  }, [data])

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    setError(null)

    try {
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
          examType: data.examType,
        } as unknown as Prisma.InputJsonValue,
        scoringConfig: {
          passingScore,
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
        await completeTemplateWizard(templateId)
        router.push(`/${locale}/exams/generate`)
      } else {
        setError(result.error || commonLabels.failedToSave[lang])
      }
    } catch {
      setError(commonLabels.errorOccurred[lang])
    } finally {
      setSaving(false)
    }
  }

  if (!data) return null

  const totalQuestions = data.questionTypes.reduce(
    (sum, qt) => sum + qt.count,
    0
  )
  const presetLabel = data.selectedPresetId ?? reviewLabels.blank[lang]

  return (
    <WizardStep
      entityId={templateId}
      isValid={true}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div>
          <h1 className="text-3xl font-bold">
            {dictionary?.title ?? getStepLabel("review", "title", locale)}
          </h1>
          <p className="text-muted-foreground text-sm">
            {dictionary?.description ??
              getStepLabel("review", "description", locale)}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Basics */}
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
                  {reviewLabels.examType[lang]}
                </span>
                <span>{EXAM_TYPE_LABELS[data.examType]?.[lang]}</span>
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
                  {reviewLabels.paper[lang]}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {presetLabel}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Question distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("questionDistribution", locale)} ({totalQuestions})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {data.questionTypes.map((qt) => (
                <div
                  key={qt.type}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">
                    {QUESTION_TYPE_LABELS[qt.type]?.[lang] || qt.type}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {qt.difficulty.EASY}/{qt.difficulty.MEDIUM}/
                    {qt.difficulty.HARD}
                    <span className="text-foreground ms-2 font-medium">
                      = {qt.count}
                    </span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Passing score */}
        <div className="space-y-2">
          <Label htmlFor="passing-score">
            {reviewLabels.passingScore[lang]}
          </Label>
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
