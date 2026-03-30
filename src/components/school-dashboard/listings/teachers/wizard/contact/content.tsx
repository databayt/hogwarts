"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useTeacherWizard } from "../use-teacher-wizard"
import { ContactForm } from "./form"

export default function ContactContent() {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const { dictionary } = useDictionary()
  const teachers = (dictionary?.school as Record<string, unknown>)?.teachers as
    | Record<string, unknown>
    | undefined
  const wizard = teachers?.wizard as Record<string, unknown> | undefined
  const t = wizard?.contact as Record<string, string> | undefined
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (data) {
      const email = data.emailAddress
      setIsValid(
        email.trim().length > 0 &&
          email.includes("@") &&
          !email.endsWith("@draft.internal")
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={teacherId}
      nextStep={`/teachers/add/${teacherId}/location`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={t?.title || "Contact Details"}
          description={
            t?.description || "Add the teacher's email and phone numbers."
          }
        />
        <ContactForm
          ref={formRef}
          teacherId={teacherId}
          initialData={
            data
              ? {
                  emailAddress: data.emailAddress.endsWith("@draft.internal")
                    ? ""
                    : data.emailAddress,
                  phone1: data.phoneNumbers[0]?.phoneNumber || "",
                  phone2: data.phoneNumbers[1]?.phoneNumber || "",
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
