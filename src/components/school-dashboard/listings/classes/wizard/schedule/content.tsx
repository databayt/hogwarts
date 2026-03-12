"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useClassWizard } from "../use-class-wizard"
import { ScheduleForm } from "./form"

export default function ScheduleContent() {
  const params = useParams()
  const classId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useClassWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.termId.length >= 1 &&
          data.startPeriodId.length >= 1 &&
          data.endPeriodId.length >= 1 &&
          data.classroomId.length >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={classId}
      nextStep={`/classes/add/${classId}/management`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Schedule & Location"
          description="Set the term, periods, and classroom for this class."
        />
        <ScheduleForm
          ref={formRef}
          classId={classId}
          initialData={
            data
              ? {
                  termId: data.termId,
                  startPeriodId: data.startPeriodId,
                  endPeriodId: data.endPeriodId,
                  classroomId: data.classroomId,
                  duration: data.duration ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
