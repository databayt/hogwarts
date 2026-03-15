"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { TEMPLATE_WIZARD_CONFIG } from "@/components/school-dashboard/exams/wizard/template-wizard/config"
import {
  TemplateWizardProvider,
  useTemplateWizard,
} from "@/components/school-dashboard/exams/wizard/template-wizard/use-template-wizard"
import { updateTemplateWizardStep } from "@/components/school-dashboard/exams/wizard/template-wizard/wizard-actions"

export default function TemplateWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={TEMPLATE_WIZARD_CONFIG}
      dataProvider={TemplateWizardProvider}
      loadHook={useTemplateWizard}
      basePath="/exams/template/add"
      onStepChange={(entityId, step) => {
        updateTemplateWizardStep(entityId, step)
      }}
      finalDestination="/exams/generate"
    >
      {children}
    </WizardLayout>
  )
}
