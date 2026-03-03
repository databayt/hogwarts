"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { WizardProvider } from "../context/wizard-provider"
import { useWizardState } from "../hooks/use-wizard-state"
import { useWizardSteps } from "../hooks/use-wizard-steps"
import { WizardShell } from "../layout/wizard-shell"
import type { TemplateWizardState } from "../types"
import { FooterPrintStep } from "./steps/footer-print-step"
import { GalleryStep } from "./steps/gallery-step"
import { InfoStep } from "./steps/info-step"
import { LayoutStep } from "./steps/layout-step"
import { PreviewStep } from "./steps/preview-step"
import { QuestionTypeStep } from "./steps/question-type-step"
import { ScoringStep } from "./steps/scoring-step"

interface SelectOption {
  id: string
  name: string
}

interface SchoolTemplate {
  id: string
  name: string
  blockConfig: unknown
}

interface ExistingTemplate {
  id: string
  name: string
  description: string | null
  subjectId: string
  duration: number
  totalMarks: number
  distribution: Record<string, Record<string, number>>
  bloomDistribution: Record<string, number> | null
}

interface TemplateWizardClientProps {
  lang: Locale
  dictionary: Dictionary
  schoolId: string
  subjects: SelectOption[]
  grades: SelectOption[]
  existingTemplate?: ExistingTemplate
  schoolTemplates?: SchoolTemplate[]
}

export function TemplateWizardClient({
  lang,
  dictionary,
  schoolId,
  subjects,
  grades,
  existingTemplate,
  schoolTemplates,
}: TemplateWizardClientProps) {
  const { state, dispatch, loadDraft, clearDraft } = useWizardState(schoolId)
  const steps = useWizardSteps(state)
  const [showResume, setShowResume] = useState(false)

  // On mount: check for existing draft or load existing template
  useEffect(() => {
    if (existingTemplate) {
      // Edit mode: load existing template into state
      dispatch({
        type: "LOAD_STATE",
        payload: {
          ...state,
          name: existingTemplate.name,
          description: existingTemplate.description || "",
          subjectIds: [existingTemplate.subjectId],
          duration: existingTemplate.duration,
          totalMarks: existingTemplate.totalMarks,
          existingTemplateId: existingTemplate.id,
          questionTypes: Object.entries(existingTemplate.distribution).map(
            ([type, difficulties]) => ({
              type: type as TemplateWizardState["questionTypes"][0]["type"],
              count: Object.values(difficulties).reduce((a, b) => a + b, 0),
              difficulty: {
                EASY: (difficulties as Record<string, number>).EASY || 0,
                MEDIUM: (difficulties as Record<string, number>).MEDIUM || 0,
                HARD: (difficulties as Record<string, number>).HARD || 0,
              },
            })
          ),
          currentStep: 0,
        },
      })
    } else {
      // New mode: check for saved draft
      const hasDraft = loadDraft()
      if (hasDraft) {
        setShowResume(true)
      }
    }
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isAr = lang === "ar"

  // Show resume draft dialog
  if (showResume) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="mx-auto max-w-md space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold">
            {isAr ? "استئناف المسودة؟" : "Resume Draft?"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isAr
              ? "لديك مسودة قالب محفوظة. هل تريد الاستمرار من حيث توقفت؟"
              : "You have a saved template draft. Would you like to continue where you left off?"}
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                clearDraft()
                dispatch({
                  type: "LOAD_STATE",
                  payload: {
                    ...state,
                    currentStep: 0,
                    name: "",
                    description: "",
                    subjectIds: [],
                    gradeIds: [],
                    questionTypes: [],
                    existingTemplateId: null,
                  },
                })
                setShowResume(false)
              }}
            >
              {isAr ? "بدء جديد" : "Start Fresh"}
            </Button>
            <Button onClick={() => setShowResume(false)}>
              {isAr ? "استئناف" : "Resume"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render the active step
  const renderStep = () => {
    const currentStepDef = steps[state.currentStep]
    if (!currentStepDef) return null

    const stepId = currentStepDef.id

    if (stepId === "gallery") {
      return <GalleryStep lang={lang} schoolTemplates={schoolTemplates} />
    }
    if (stepId === "info") {
      return <InfoStep lang={lang} subjects={subjects} grades={grades} />
    }
    if (stepId === "layout") {
      return <LayoutStep lang={lang} />
    }
    if (stepId.startsWith("question-")) {
      const questionType = stepId.replace("question-", "")
      const qIdx = state.questionTypes.findIndex((q) => q.type === questionType)
      if (qIdx >= 0) {
        return <QuestionTypeStep lang={lang} questionTypeIndex={qIdx} />
      }
    }
    if (stepId === "scoring") {
      return <ScoringStep lang={lang} />
    }
    if (stepId === "footer-print") {
      return <FooterPrintStep lang={lang} />
    }
    if (stepId === "preview") {
      return <PreviewStep lang={lang} schoolId={schoolId} />
    }

    return null
  }

  return (
    <WizardProvider
      value={{
        state,
        dispatch,
        totalSteps: steps.length,
        clearDraft,
      }}
    >
      <WizardShell steps={steps} lang={lang}>
        {renderStep()}
      </WizardShell>
    </WizardProvider>
  )
}
