"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateParentWizardStep } from "@/components/school-dashboard/listings/parents/wizard/actions"
import { PARENT_WIZARD_CONFIG } from "@/components/school-dashboard/listings/parents/wizard/config"
import ContactContent from "@/components/school-dashboard/listings/parents/wizard/contact/content"
import InformationContent from "@/components/school-dashboard/listings/parents/wizard/information/content"
import {
  ParentWizardProvider,
  useParentWizard,
} from "@/components/school-dashboard/listings/parents/wizard/use-parent-wizard"

// Steps switch in the browser — no request between them (see WizardLayout).
const STEPS = {
  information: InformationContent,
  contact: ContactContent,
}

export default function ParentWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={PARENT_WIZARD_CONFIG}
      dataProvider={ParentWizardProvider}
      loadHook={useParentWizard}
      basePath="/parents/add"
      onStepChange={(entityId, step) =>
        updateParentWizardStep(entityId, step)
      }
      steps={STEPS}
      finalLabel="Complete"
    >
      {children}
    </WizardLayout>
  )
}
