"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Locale } from "@/components/internationalization/config"

import { getExamWizardSteps, useExamWizardState } from "./hooks"
import { PaperConfigStep } from "./steps/paper-config-step"
import { PreviewStep } from "./steps/preview-step"
import { QuestionBankStep } from "./steps/question-bank-step"
import { SelectExamStep } from "./steps/select-exam-step"
import { SelectTemplateStep } from "./steps/select-template-step"
import type {
  ClassOption,
  ExamOption,
  QuestionOption,
  TemplateOption,
} from "./types"

interface ExamWizardClientProps {
  lang: Locale
  templates: TemplateOption[]
  existingExams: ExamOption[]
  classes: ClassOption[]
  questions: QuestionOption[]
}

export function ExamWizardClient({
  lang,
  templates,
  existingExams,
  classes,
  questions,
}: ExamWizardClientProps) {
  const [state, dispatch] = useExamWizardState()
  const steps = getExamWizardSteps()
  const router = useRouter()
  const isAr = lang === "ar"

  const currentStepDef = steps[state.currentStep]
  const progress = ((state.currentStep + 1) / steps.length) * 100

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === state.templateId) || null,
    [templates, state.templateId]
  )

  // Filter questions by template subject
  const filteredQuestions = useMemo(() => {
    if (!selectedTemplate) return questions
    return questions.filter(
      (q) => true // All questions are already scoped by school + template subject on server
    )
  }, [questions, selectedTemplate])

  const canGoNext = currentStepDef?.isComplete(state) ?? false
  const isLastStep = state.currentStep === steps.length - 1

  const renderStep = () => {
    switch (currentStepDef?.id) {
      case "template":
        return (
          <SelectTemplateStep
            lang={lang}
            templates={templates}
            selectedId={state.templateId}
            dispatch={dispatch}
          />
        )
      case "exam":
        return (
          <SelectExamStep
            lang={lang}
            state={state}
            dispatch={dispatch}
            existingExams={existingExams}
            classes={classes}
          />
        )
      case "questions":
        return (
          <QuestionBankStep
            lang={lang}
            questions={filteredQuestions}
            selectedIds={state.selectedQuestionIds}
            template={selectedTemplate}
            autoFilled={state.autoFilled}
            dispatch={dispatch}
          />
        )
      case "paper-config":
        return <PaperConfigStep lang={lang} state={state} dispatch={dispatch} />
      case "preview":
        return (
          <PreviewStep
            lang={lang}
            state={state}
            template={selectedTemplate}
            questions={filteredQuestions}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${lang}/exams/generate`)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm font-medium">
              {isAr ? "معالج إنشاء الاختبار" : "Exam Generation Wizard"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isAr ? "الخطوة" : "Step"} {state.currentStep + 1} /{" "}
              {steps.length}: {currentStepDef?.label[isAr ? "ar" : "en"]}
            </p>
          </div>
        </div>
        <Progress value={progress} className="max-w-[200px]" />
      </div>

      {/* Sidebar + Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Step sidebar */}
        <aside className="bg-muted/30 hidden w-56 shrink-0 border-e p-4 md:block">
          <nav className="space-y-1">
            {steps.map((step, idx) => {
              const isActive = idx === state.currentStep
              const isDone = step.isComplete(state)
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm transition ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "text-foreground hover:bg-muted"
                        : "text-muted-foreground"
                  }`}
                  onClick={() => dispatch({ type: "SET_STEP", payload: idx })}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : isDone
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate">
                    {step.label[isAr ? "ar" : "en"]}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main canvas */}
        <main className="flex-1 overflow-y-auto p-6">{renderStep()}</main>
      </div>

      {/* Bottom navigation */}
      {!isLastStep && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={state.currentStep === 0}
            onClick={() => dispatch({ type: "PREV_STEP" })}
          >
            <ChevronLeft className="me-1 h-4 w-4" />
            {isAr ? "السابق" : "Previous"}
          </Button>
          <Button
            size="sm"
            disabled={!canGoNext}
            onClick={() => dispatch({ type: "NEXT_STEP" })}
          >
            {isAr ? "التالي" : "Next"}
            <ChevronRight className="ms-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
