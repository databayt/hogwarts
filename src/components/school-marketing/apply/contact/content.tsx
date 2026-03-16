"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import type { ContactStepData } from "../types"
import { useApplyValidation } from "../validation-context"
import { CONTACT_STEP_CONFIG } from "./config"
import { ContactForm } from "./form"
import type { ContactFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function ContactContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const contactFormRef = useRef<ContactFormRef>(null)

  const initialData = getStepData("contact")

  const onNext = useCallback(async () => {
    if (contactFormRef.current) {
      try {
        await contactFormRef.current.saveAndNext()
        router.push(`/${locale}/apply/${id}/location`)
      } catch (error) {
        console.error("Error saving contact step:", error)
      }
    }
  }, [locale, id, router])

  useEffect(() => {
    const contactData = session.formData.contact

    const isValid = contactData?.email && contactData?.phone

    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.contact,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  return (
    <FormLayout>
      <FormHeading
        title={CONTACT_STEP_CONFIG.label(isRTL)}
        description={CONTACT_STEP_CONFIG.description(isRTL)}
      />
      <ContactForm
        ref={contactFormRef}
        initialData={initialData as ContactStepData}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
