"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateEventWizardStep } from "@/components/school-dashboard/listings/events/wizard/actions"
import { EVENT_WIZARD_CONFIG } from "@/components/school-dashboard/listings/events/wizard/config"
import {
  EventWizardProvider,
  useEventWizard,
} from "@/components/school-dashboard/listings/events/wizard/use-event-wizard"

export default function EventWizardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={EVENT_WIZARD_CONFIG}
      dataProvider={EventWizardProvider}
      loadHook={useEventWizard}
      basePath="/events/add"
      onStepChange={(entityId, step) => {
        updateEventWizardStep(entityId, step)
      }}
      finalLabel="Complete"
    >
      {children}
    </WizardLayout>
  )
}
