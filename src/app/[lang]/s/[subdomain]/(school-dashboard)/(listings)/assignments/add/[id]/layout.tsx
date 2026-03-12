"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateAssignmentWizardStep } from "@/components/school-dashboard/listings/assignments/wizard/actions"
import { ASSIGNMENT_WIZARD_CONFIG } from "@/components/school-dashboard/listings/assignments/wizard/config"
import {
  AssignmentWizardProvider,
  useAssignmentWizard,
} from "@/components/school-dashboard/listings/assignments/wizard/use-assignment-wizard"

export default function AssignmentWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={ASSIGNMENT_WIZARD_CONFIG}
      dataProvider={AssignmentWizardProvider}
      loadHook={useAssignmentWizard}
      basePath="/assignments/add"
      onStepChange={(entityId, step) => {
        updateAssignmentWizardStep(entityId, step)
      }}
      finalLabel="Create Assignment"
    >
      {children}
    </WizardLayout>
  )
}
