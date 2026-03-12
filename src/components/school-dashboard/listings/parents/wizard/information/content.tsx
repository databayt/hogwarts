"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useParentWizard } from "../use-parent-wizard"
import { InformationForm } from "./form"

export default function InformationContent() {
  const params = useParams()
  const parentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useParentWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.givenName.trim().length >= 1 && data.surname.trim().length >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={parentId}
      nextStep={`/parents/add/${parentId}/contact`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Basic Information"
          description="Enter the parent/guardian's personal information."
        />
        <InformationForm
          ref={formRef}
          parentId={parentId}
          initialData={
            data
              ? {
                  givenName: data.givenName,
                  surname: data.surname,
                  emailAddress: data.emailAddress ?? undefined,
                  profilePhotoUrl: data.profilePhotoUrl ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
