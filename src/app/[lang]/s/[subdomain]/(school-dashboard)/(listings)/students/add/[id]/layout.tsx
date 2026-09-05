"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useMemo } from "react"

import { WizardLayout } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { updateStudentWizardStep } from "@/components/school-dashboard/listings/students/wizard/actions"
import { STUDENT_WIZARD_CONFIG } from "@/components/school-dashboard/listings/students/wizard/config"
import { finishStudentWizard } from "@/components/school-dashboard/listings/students/wizard/finish"
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
        wizard?.basicInformation || "Basic Information",
        wizard?.address || "Address",
        wizard?.academic || "Academic",
      ],
    }),
    [wizard]
  )

  return (
    <WizardLayout
      config={translatedConfig}
      dataProvider={StudentWizardProvider}
      loadHook={useStudentWizard}
      basePath="/students/add"
      backLabel={wizard?.back}
      onStepChange={(entityId, step) => {
        updateStudentWizardStep(entityId, step)
      }}
      onComplete={async (entityId) => {
        // Same finisher as the academic step's Next: warnings toasted, the
        // minted login handed to the credentials dialog. The footer only
        // navigates when this resolves, so a failed finish must throw.
        const ok = await finishStudentWizard(entityId, dictionary)
        if (!ok) throw new Error("WIZARD_INCOMPLETE")
      }}
      finalDestination="/students"
      wizardStepField="wizardStep"
    >
      {children}
    </WizardLayout>
  )
}
