"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateQuestionWizardStep } from "@/components/school-dashboard/exams/qbank/wizard/actions"
import { QUESTION_WIZARD_CONFIG } from "@/components/school-dashboard/exams/qbank/wizard/config"
import {
  QuestionWizardProvider,
  useQuestionWizard,
} from "@/components/school-dashboard/exams/qbank/wizard/use-question-wizard"

export default function QuestionWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={QUESTION_WIZARD_CONFIG}
      dataProvider={QuestionWizardProvider}
      loadHook={useQuestionWizard}
      basePath="/exams/qbank/add"
      onStepChange={(entityId, step) => {
        updateQuestionWizardStep(entityId, step)
      }}
      finalLabel="Save Question"
    >
      {children}
    </WizardLayout>
  )
}
