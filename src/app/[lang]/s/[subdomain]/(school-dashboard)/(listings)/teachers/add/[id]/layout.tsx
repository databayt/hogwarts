"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import {
  completeTeacherWizard,
  updateTeacherWizardStep,
} from "@/components/school-dashboard/listings/teachers/wizard/actions"
import { TEACHER_WIZARD_CONFIG } from "@/components/school-dashboard/listings/teachers/wizard/config"
import {
  TeacherWizardProvider,
  useTeacherWizard,
} from "@/components/school-dashboard/listings/teachers/wizard/use-teacher-wizard"

export default function TeacherWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={TEACHER_WIZARD_CONFIG}
      dataProvider={TeacherWizardProvider}
      loadHook={useTeacherWizard}
      basePath="/teachers/add"
      onStepChange={(entityId, step) => {
        updateTeacherWizardStep(entityId, step)
      }}
      onComplete={async (entityId) => {
        await completeTeacherWizard(entityId)
      }}
      finalLabel="Create"
      finalDestination="/teachers"
    >
      {children}
    </WizardLayout>
  )
}
