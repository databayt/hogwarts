"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateAnnouncementWizardStep } from "@/components/school-dashboard/listings/announcements/wizard/actions"
import { ANNOUNCEMENT_WIZARD_CONFIG } from "@/components/school-dashboard/listings/announcements/wizard/config"
import {
  AnnouncementWizardProvider,
  useAnnouncementWizard,
} from "@/components/school-dashboard/listings/announcements/wizard/use-announcement-wizard"

export default function AnnouncementWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={ANNOUNCEMENT_WIZARD_CONFIG}
      dataProvider={AnnouncementWizardProvider}
      loadHook={useAnnouncementWizard}
      basePath="/announcements/add"
      onStepChange={(entityId, step) => {
        updateAnnouncementWizardStep(entityId, step)
      }}
      finalLabel="Publish"
    >
      {children}
    </WizardLayout>
  )
}
