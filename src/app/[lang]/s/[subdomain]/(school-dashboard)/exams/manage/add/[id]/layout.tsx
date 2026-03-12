"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateExamWizardStep } from "@/components/school-dashboard/exams/manage/wizard/actions"
import { EXAM_WIZARD_CONFIG } from "@/components/school-dashboard/exams/manage/wizard/config"
import {
  ExamWizardProvider,
  useExamWizard,
} from "@/components/school-dashboard/exams/manage/wizard/use-exam-wizard"

export default function ExamWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={EXAM_WIZARD_CONFIG}
      dataProvider={ExamWizardProvider}
      loadHook={useExamWizard}
      basePath="/exams/manage/add"
      onStepChange={(entityId, step) => {
        updateExamWizardStep(entityId, step)
      }}
      finalLabel="Complete"
    >
      {children}
    </WizardLayout>
  )
}
