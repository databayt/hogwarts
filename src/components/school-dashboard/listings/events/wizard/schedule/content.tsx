"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useEventWizard } from "../use-event-wizard"
import { ScheduleForm } from "./form"

export default function ScheduleContent() {
  const params = useParams()
  const eventId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useEventWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        !!data.eventDate &&
          data.startTime.length >= 1 &&
          data.endTime.length >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={eventId}
      nextStep={`/events/add/${eventId}/settings`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Event Schedule"
          description="Set the date, time, and location for this event."
        />
        <ScheduleForm
          ref={formRef}
          eventId={eventId}
          initialData={
            data
              ? {
                  eventDate: data.eventDate,
                  startTime: data.startTime,
                  endTime: data.endTime,
                  location: data.location ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
