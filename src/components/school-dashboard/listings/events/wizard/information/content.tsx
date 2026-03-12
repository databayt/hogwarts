"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useEventWizard } from "../use-event-wizard"
import { InformationForm } from "./form"

export default function InformationContent() {
  const params = useParams()
  const eventId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useEventWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(data.title.trim().length >= 1)
    }
  }, [data])

  return (
    <WizardStep
      entityId={eventId}
      nextStep={`/events/add/${eventId}/schedule`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Event Information"
          description="Enter the basic details for this event."
        />
        <InformationForm
          ref={formRef}
          eventId={eventId}
          initialData={
            data
              ? {
                  title: data.title,
                  description: data.description ?? undefined,
                  eventType: data.eventType as
                    | "ACADEMIC"
                    | "SPORTS"
                    | "CULTURAL"
                    | "PARENT_MEETING"
                    | "CELEBRATION"
                    | "WORKSHOP"
                    | "OTHER"
                    | undefined,
                  organizer: data.organizer ?? undefined,
                  targetAudience: data.targetAudience ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
