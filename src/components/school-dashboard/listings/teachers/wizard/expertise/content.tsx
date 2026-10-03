"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { Suspense, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { Skeleton } from "@/components/ui/skeleton"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useTeacherWizard } from "../use-teacher-wizard"
import { ExpertiseForm } from "./form"
import { useTeacherExpertiseGrades } from "./resources"

export default function ExpertiseContent() {
  return (
    <Suspense
      fallback={
        <FormLayout>
          <div className="space-y-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </FormLayout>
      }
    >
      <ExpertiseStep />
    </Suspense>
  )
}

function ExpertiseStep() {
  const grades = useTeacherExpertiseGrades()
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const { dictionary } = useDictionary()
  const teachers = (dictionary?.school as Record<string, unknown>)?.teachers as
    | Record<string, unknown>
    | undefined
  const wizard = teachers?.wizard as Record<string, unknown> | undefined
  const t = wizard?.expertise as Record<string, string> | undefined
  const [isValid, setIsValid] = useState(true) // optional step

  return (
    <WizardStep
      entityId={teacherId}
      nextStep={`/teachers/add/${teacherId}/contact`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={t?.title || "Subject Expertise"}
          description={
            t?.description ||
            "Select the teacher's subject expertise areas. This step is optional."
          }
        />
        <ExpertiseForm
          ref={formRef}
          teacherId={teacherId}
          grades={grades}
          initialData={
            data
              ? {
                  subjectExpertise: data.subjectExpertise.map((e) => ({
                    subjectId: e.subjectId,
                    expertiseLevel: e.expertiseLevel as "PRIMARY" | "SECONDARY",
                  })),
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
