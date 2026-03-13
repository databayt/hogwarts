"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { EXAM_GENERATE_WIZARD_CONFIG } from "@/components/school-dashboard/exams/wizard/exam-wizard-v2/config"
import {
  ExamGenerateWizardProvider,
  useExamGenerateWizard,
} from "@/components/school-dashboard/exams/wizard/exam-wizard-v2/use-exam-generate-wizard"
import { updateExamGenerateWizardStep } from "@/components/school-dashboard/exams/wizard/exam-wizard-v2/wizard-actions"

export default function ExamGenerateWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={EXAM_GENERATE_WIZARD_CONFIG}
      dataProvider={ExamGenerateWizardProvider}
      loadHook={useExamGenerateWizard}
      basePath="/exams/generate/add"
      onStepChange={(entityId, step) => {
        updateExamGenerateWizardStep(entityId, step)
      }}
      finalLabel="Generate Exam"
    >
      {children}
    </WizardLayout>
  )
}
