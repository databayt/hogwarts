"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useParentWizard } from "../use-parent-wizard"
import { ContactForm } from "./form"

export default function ContactContent() {
  const params = useParams()
  const parentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useParentWizard()
  const [isValid, setIsValid] = useState(true)

  // Contact is always valid (phone numbers are optional)
  useEffect(() => {
    if (data) {
      setIsValid(true)
    }
  }, [data])

  return (
    <WizardStep
      entityId={parentId}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Contact Details"
          description="Add the parent/guardian's phone numbers."
        />
        <ContactForm
          ref={formRef}
          parentId={parentId}
          initialData={
            data
              ? {
                  phoneNumbers: data.phoneNumbers.map((p) => ({
                    phoneType: p.phoneType as
                      | "mobile"
                      | "home"
                      | "work"
                      | "emergency",
                    phoneNumber: p.phoneNumber,
                    isPrimary: p.isPrimary,
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
