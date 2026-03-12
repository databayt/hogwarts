"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateClassWizardStep } from "@/components/school-dashboard/listings/classes/wizard/actions"
import { CLASS_WIZARD_CONFIG } from "@/components/school-dashboard/listings/classes/wizard/config"
import {
  ClassWizardProvider,
  useClassWizard,
} from "@/components/school-dashboard/listings/classes/wizard/use-class-wizard"

export default function ClassWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={CLASS_WIZARD_CONFIG}
      dataProvider={ClassWizardProvider}
      loadHook={useClassWizard}
      basePath="/classes/add"
      onStepChange={(entityId, step) => {
        updateClassWizardStep(entityId, step)
      }}
      finalLabel="Complete"
    >
      {children}
    </WizardLayout>
  )
}
