"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useMemo } from "react"

import { WizardLayout } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  completeStudentWizard,
  updateStudentWizardStep,
} from "@/components/school-dashboard/listings/students/wizard/actions"
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
  const { dictionary } = useDictionary()
  const students = (dictionary?.school as any)?.students
  const wizard = students?.wizard as Record<string, string> | undefined

  // Translate wizard config group labels and finalLabel
  const translatedConfig = useMemo(
    () => ({
      ...STUDENT_WIZARD_CONFIG,
      groupLabels: [
        wizard?.essentials || "Essentials",
        wizard?.contactDetails || "Contact Details",
        wizard?.healthHistory || "Health & History",
      ],
      finalLabel: wizard?.complete || "Complete",
    }),
    [wizard]
  )

  return (
    <WizardLayout
      config={translatedConfig}
      dataProvider={StudentWizardProvider}
      loadHook={useStudentWizard}
      basePath="/students/add"
      onStepChange={(entityId, step) => {
        updateStudentWizardStep(entityId, step)
      }}
      onComplete={async (entityId) => {
        await completeStudentWizard(entityId)
      }}
      finalLabel={translatedConfig.finalLabel}
      finalDestination="/students"
    >
      {children}
    </WizardLayout>
  )
}
