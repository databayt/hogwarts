"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useStudentWizard } from "../use-student-wizard"
import { ContactForm } from "./form"

const TAB_HEADINGS: Record<string, { title: string; description: string }> = {
  contact: {
    title: "Contact Information",
    description: "Add the student's contact details.",
  },
  emergency: {
    title: "Emergency Contact",
    description: "Add the student's emergency contact information.",
  },
}

export default function ContactContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)

  const { dictionary } = useDictionary()
  const students = (dictionary?.school as any)?.students
  const t = students?.contact as Record<string, string> | undefined

  const localizedHeadings: Record<
    string,
    { title: string; description: string }
  > = {
    contact: {
      title: t?.title || TAB_HEADINGS.contact.title,
      description: t?.description || TAB_HEADINGS.contact.description,
    },
    emergency: {
      title: t?.emergencyTitle || TAB_HEADINGS.emergency.title,
      description:
        t?.emergencyDescription || TAB_HEADINGS.emergency.description,
    },
  }

  const [heading, setHeading] = useState(localizedHeadings.contact)

  // Update heading when dictionary loads
  React.useEffect(() => {
    setHeading(localizedHeadings.contact)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.title, t?.emergencyTitle])

  const handleTabChange = (tabId: string) => {
    setHeading(localizedHeadings[tabId] || localizedHeadings.contact)
  }

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/location`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading title={heading.title} description={heading.description} />
        <ContactForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? {
                  email: data.email ?? undefined,
                  mobileNumber: data.mobileNumber ?? undefined,
                  alternatePhone: data.alternatePhone ?? undefined,
                  emergencyContactName: data.emergencyContactName ?? undefined,
                  emergencyContactPhone:
                    data.emergencyContactPhone ?? undefined,
                  emergencyContactRelation:
                    data.emergencyContactRelation ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
          onTabChange={handleTabChange}
        />
      </FormLayout>
    </WizardStep>
  )
}
