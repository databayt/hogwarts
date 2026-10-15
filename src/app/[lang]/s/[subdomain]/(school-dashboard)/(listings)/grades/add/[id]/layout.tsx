"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  discardEmptyGradeDraft,
  updateGradeWizardStep,
} from "@/components/school-dashboard/listings/grades/wizard/actions"
import { getDictGradeWizardConfig } from "@/components/school-dashboard/listings/grades/wizard/config"
import {
  GradeWizardProvider,
  useGradeWizard,
} from "@/components/school-dashboard/listings/grades/wizard/use-grade-wizard"

export default function GradeWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { dictionary } = useDictionary()
  const config = getDictGradeWizardConfig(dictionary?.school?.grades)
  return (
    <WizardLayout
      config={config}
      dataProvider={GradeWizardProvider}
      loadHook={useGradeWizard}
      basePath="/grades/add"
      closeDestination="/grades/book"
      finalDestination="/grades/book"
      onClose={(entityId) => discardEmptyGradeDraft(entityId)}
      onStepChange={(entityId, step) => {
        updateGradeWizardStep(entityId, step)
      }}
      finalLabel={config.finalLabel}
    >
      {children}
    </WizardLayout>
  )
}
