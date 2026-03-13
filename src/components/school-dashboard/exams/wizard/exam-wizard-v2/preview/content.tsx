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

  // Set up completion navigation: complete wizard + redirect
  useEffect(() => {
    const handleNext = async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      try {
        const result = await completeExamGenerateWizard(generatedExamId)
        if (result.success) {
          router.push("/exams/generate")
        }
      } catch {
        // Error handled
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [generatedExamId, router, setCustomNavigation])

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
          title="Preview & Generate"
          description="Review the exam configuration before generating."
        />
        {data && (
          <div className="space-y-6">
            {/* Template */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {data.templateName || "No template selected"}
                </p>
              </CardContent>
            </Card>

            {/* Exam Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  Exam Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Title</p>
                    <p className="text-sm font-medium">
                      {data.examTitle || "Untitled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Date</p>
                    <p className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3.5 w-3.5" />
                      {data.examDate
                        ? new Date(data.examDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Duration</p>
                    <p className="flex items-center gap-1 text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      {data.examDuration} min
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Marks</p>
                    <p className="text-sm">
                      {data.examTotalMarks} total / {data.examPassingMarks}{" "}
                      passing
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
                  Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {data.selectedQuestionIds.length} questions selected
                  </Badge>
                  {data.totalQuestions > 0 && (
                    <span className="text-muted-foreground text-sm">
                      Total: {data.totalQuestions}
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
                  Paper Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Template</p>
                    <p className="text-sm">{data.paperTemplate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Page Size</p>
                    <p className="text-sm">{data.pageSize}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Versions</p>
                    <p className="text-sm">{data.versionCount}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {data.shuffleQuestions && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      Shuffle Questions
                    </Badge>
                  )}
                  {data.shuffleOptions && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      Shuffle Options
                    </Badge>
                  )}
                  {data.showSchoolLogo && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      School Logo
                    </Badge>
                  )}
                  {data.showInstructions && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      Instructions
                    </Badge>
                  )}
                  {data.showPointsPerQuestion && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      Points Per Question
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
