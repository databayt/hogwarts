"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useEventWizard } from "../use-event-wizard"
import { SettingsForm } from "./form"

export default function SettingsContent() {
  const params = useParams()
  const eventId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useEventWizard()
  const [isValid, setIsValid] = useState(true)

  // Settings is always valid (no required fields)
  useEffect(() => {
    if (data) {
      setIsValid(true)
    }
  }, [data])

  return (
    <WizardStep
      entityId={eventId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Event Settings"
          description="Configure additional settings for this event."
        />
        <SettingsForm
          ref={formRef}
          eventId={eventId}
          initialData={
            data
              ? {
                  maxAttendees: data.maxAttendees ?? undefined,
                  isPublic: data.isPublic,
                  registrationRequired: data.registrationRequired,
                  notes: data.notes ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
