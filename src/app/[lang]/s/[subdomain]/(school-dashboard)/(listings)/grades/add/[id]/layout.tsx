"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateGradeWizardStep } from "@/components/school-dashboard/listings/grades/wizard/actions"
import { GRADE_WIZARD_CONFIG } from "@/components/school-dashboard/listings/grades/wizard/config"
import {
  GradeWizardProvider,
  useGradeWizard,
} from "@/components/school-dashboard/listings/grades/wizard/use-grade-wizard"

export default function GradeWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={GRADE_WIZARD_CONFIG}
      dataProvider={GradeWizardProvider}
      loadHook={useGradeWizard}
      basePath="/grades/add"
      onStepChange={(entityId, step) => {
        updateGradeWizardStep(entityId, step)
      }}
      finalLabel="Save Grade"
    >
      {children}
    </WizardLayout>
  )
}
