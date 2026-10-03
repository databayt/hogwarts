"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  discardEmptyTeacherDraft,
  updateTeacherWizardStep,
} from "@/components/school-dashboard/listings/teachers/wizard/actions"
import AttachmentsContent from "@/components/school-dashboard/listings/teachers/wizard/attachments/content"
import { TEACHER_WIZARD_CONFIG } from "@/components/school-dashboard/listings/teachers/wizard/config"
import ContactContent from "@/components/school-dashboard/listings/teachers/wizard/contact/content"
import EmploymentContent from "@/components/school-dashboard/listings/teachers/wizard/employment/content"
import ExpertiseContent from "@/components/school-dashboard/listings/teachers/wizard/expertise/content"
import { TeacherExpertiseResources } from "@/components/school-dashboard/listings/teachers/wizard/expertise/resources"
import { finishTeacherWizard } from "@/components/school-dashboard/listings/teachers/wizard/finish"
import InformationContent from "@/components/school-dashboard/listings/teachers/wizard/information/content"
import LocationContent from "@/components/school-dashboard/listings/teachers/wizard/location/content"
import {
  TeacherWizardProvider,
  useTeacherWizard,
} from "@/components/school-dashboard/listings/teachers/wizard/use-teacher-wizard"

// Steps switch in the browser — no request between them (see WizardLayout).
const STEPS = {
  attachments: AttachmentsContent,
  information: InformationContent,
  expertise: ExpertiseContent,
  contact: ContactContent,
  location: LocationContent,
  employment: EmploymentContent,
}

export default function TeacherWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { dictionary } = useDictionary()

  return (
    <TeacherExpertiseResources>
    <WizardLayout
      config={TEACHER_WIZARD_CONFIG}
      dataProvider={TeacherWizardProvider}
      loadHook={useTeacherWizard}
      basePath="/teachers/add"
      onStepChange={(entityId, step) =>
        updateTeacherWizardStep(entityId, step)
      }
      steps={STEPS}
      onClose={(entityId) => discardEmptyTeacherDraft(entityId)}
      onComplete={async (entityId) => {
        const ok = await finishTeacherWizard(entityId, dictionary)
        if (!ok) throw new Error("WIZARD_INCOMPLETE")
      }}
      finalDestination="/teachers"
      wizardStepField="wizardStep"
    >
      {children}
    </WizardLayout>
    </TeacherExpertiseResources>
  )
}
