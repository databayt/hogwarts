"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { updateAssignmentWizardStep } from "@/components/school-dashboard/listings/assignments/wizard/actions"
import { getDictAssignmentWizardConfig } from "@/components/school-dashboard/listings/assignments/wizard/config"
import {
  AssignmentWizardProvider,
  useAssignmentWizard,
} from "@/components/school-dashboard/listings/assignments/wizard/use-assignment-wizard"

export default function AssignmentWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The wizard's own labels, from the dictionary in the page's language.
  const { dictionary } = useDictionary()
  const config = getDictAssignmentWizardConfig(
    (dictionary?.school as Record<string, any> | undefined)?.assignments
  )
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
