"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import { useParams } from "next/navigation"

import { WizardLayout } from "@/components/form/wizard"
import { updateAssignmentWizardStep } from "@/components/school-dashboard/listings/assignments/wizard/actions"
import { getAssignmentWizardConfig } from "@/components/school-dashboard/listings/assignments/wizard/config"
import {
  AssignmentWizardProvider,
  useAssignmentWizard,
} from "@/components/school-dashboard/listings/assignments/wizard/use-assignment-wizard"

export default function AssignmentWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The wizard's own labels in the page's language (the English config's
  // "Create Assignment" showed on /ar).
  const { lang } = useParams<{ lang: string }>()
  const config = getAssignmentWizardConfig(lang)
  return (
    <WizardLayout
      config={config}
      dataProvider={AssignmentWizardProvider}
      loadHook={useAssignmentWizard}
      basePath="/assignments/add"
      onStepChange={(entityId, step) => {
        updateAssignmentWizardStep(entityId, step)
      }}
      finalLabel={config.finalLabel}
    >
      {children}
    </WizardLayout>
  )
}
