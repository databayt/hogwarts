"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateStudentWizardStep } from "@/components/school-dashboard/listings/students/wizard/actions"
import { STUDENT_WIZARD_CONFIG } from "@/components/school-dashboard/listings/students/wizard/config"
import {
  StudentWizardProvider,
  useStudentWizard,
} from "@/components/school-dashboard/listings/students/wizard/use-student-wizard"

export default function StudentWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={STUDENT_WIZARD_CONFIG}
      dataProvider={StudentWizardProvider}
      loadHook={useStudentWizard}
      basePath="/students/add"
      onStepChange={(entityId, step) => {
        updateStudentWizardStep(entityId, step)
      }}
      finalLabel="Complete"
    >
      {children}
    </WizardLayout>
  )
}
