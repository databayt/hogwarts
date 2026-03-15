"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Hash,
  Layout,
  Settings,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { getStepLabel, t } from "../labels"
import { useExamGenerateWizard } from "../use-exam-generate-wizard"
import { completeExamGenerateWizard } from "../wizard-actions"

export default function PreviewContent() {
  const params = useParams()
  const router = useRouter()
  const generatedExamId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useExamGenerateWizard()
  const { setCustomNavigation } = useWizardValidation()
  const [isValid] = useState(true)
  const isSavingRef = useRef(false)
  const { locale } = useLocale()

  const lang = params.lang as string

  // Set up completion navigation: complete wizard + redirect
  useEffect(() => {
    const handleNext = async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      try {
        const result = await completeExamGenerateWizard(generatedExamId)
        if (result.success) {
          router.push(`/${lang}/exams/generate`)
        }
      } catch {
        // Error handled
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [generatedExamId, lang, router, setCustomNavigation])

  return (
    <WizardStep
      entityId={generatedExamId}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading
          title={getStepLabel("preview", "title", locale)}
          description={getStepLabel("preview", "description", locale)}
        />
        {data && (
          <div className="space-y-6">
            {/* Template */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  {t("template", locale)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {data.templateName || t("noTemplate", locale)}
                </p>
              </CardContent>
            </Card>

            {/* Exam Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  {t("examDetails", locale)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("title", locale)}
                    </p>
                    <p className="text-sm font-medium">
                      {data.examTitle || t("untitled", locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("date", locale)}
                    </p>
                    <p className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3.5 w-3.5" />
                      {data.examDate
                        ? new Date(data.examDate).toLocaleDateString(
                            locale === "ar" ? "ar-SA" : "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : t("notSet", locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("duration", locale)}
                    </p>
                    <p className="flex items-center gap-1 text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      {data.examDuration} {t("min", locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("marks", locale)}
                    </p>
                    <p className="text-sm">
                      {data.examTotalMarks} {t("total", locale)} /{" "}
                      {data.examPassingMarks} {t("passing", locale)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="h-4 w-4" />
                  {t("questions", locale)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {data.selectedQuestionIds.length}{" "}
                    {t("questionsSelected", locale)}
                  </Badge>
                  {data.totalQuestions > 0 && (
                    <span className="text-muted-foreground text-sm">
                      {t("totalLabel", locale)}: {data.totalQuestions}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Paper Config */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layout className="h-4 w-4" />
                  {t("paperConfig", locale)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("template", locale)}
                    </p>
                    <p className="text-sm">{data.paperTemplate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("pageSize", locale)}
                    </p>
                    <p className="text-sm">{data.pageSize}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("versions", locale)}
                    </p>
                    <p className="text-sm">{data.versionCount}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {data.shuffleQuestions && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      {t("shuffleQuestions", locale)}
                    </Badge>
                  )}
                  {data.shuffleOptions && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      {t("shuffleOptions", locale)}
                    </Badge>
                  )}
                  {data.showSchoolLogo && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      {t("schoolLogo", locale)}
                    </Badge>
                  )}
                  {data.showInstructions && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      {t("instructions", locale)}
                    </Badge>
                  )}
                  {data.showPointsPerQuestion && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      {t("pointsPerQuestion", locale)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </FormLayout>
    </WizardStep>
  )
}
