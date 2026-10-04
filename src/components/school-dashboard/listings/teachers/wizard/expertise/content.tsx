"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// The wizard's "expertise" step (route slug kept) is now "Subjects &
// sections": the admin picks what this teacher teaches and where, and saving
// puts them on those periods in the timetable. Qualification-only expertise
// (Primary/Secondary) is gone from the wizard — assigning a subject records
// the qualification too.
import React, { useRef } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { TeacherSubjectsEditor } from "../../subjects/editor"
import { useTeacherWizard } from "../use-teacher-wizard"

export default function ExpertiseContent() {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { isLoading } = useTeacherWizard()
  const { dictionary } = useDictionary()
  const t = (
    (dictionary?.school as Record<string, unknown> | undefined)?.teachers as
      | Record<string, unknown>
      | undefined
  )?.subjectsEditor as Record<string, string> | undefined

  return (
    <WizardStep
      entityId={teacherId}
      nextStep={`/teachers/add/${teacherId}/contact`}
      isValid // optional step: saving nothing is fine
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={t?.title || "Subjects & sections"}
          description={
            t?.description ||
            "Pick the subjects this teacher teaches and in which sections. Those periods in the timetable get this teacher."
          }
        />
        <TeacherSubjectsEditor ref={formRef} teacherId={teacherId} />
      </FormLayout>
    </WizardStep>
  )
}
