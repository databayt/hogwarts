"use client"

import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Phone } from "lucide-react"

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
  const subdomain = params.subdomain as string
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const contactFormRef = useRef<ContactFormRef>(null)

  const initialData = getStepData("contact")

  const onNext = useCallback(async () => {
    if (contactFormRef.current) {
      try {
        await contactFormRef.current.saveAndNext()
        router.push(`/${locale}/apply/${id}/guardian`)
      } catch (error) {
        console.error("Error saving contact step:", error)
      }
    }
  }, [locale, subdomain, id, router])

  useEffect(() => {
    const contactData = session.formData.contact

    const isValid =
      contactData?.email &&
      contactData?.phone &&
      contactData?.address &&
      contactData?.city &&
      contactData?.state &&
      contactData?.country

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

  const dict = ((dictionary as Record<string, Record<string, string>> | null)
    ?.apply?.contact ?? {}) as Record<string, string>

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start gap-4">
          <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <Phone className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title || CONTACT_STEP_CONFIG.label}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description || CONTACT_STEP_CONFIG.description}
            </p>
          </div>
        </div>

        <ContactForm
          ref={contactFormRef}
          initialData={initialData as ContactStepData}
          dictionary={dictionary}
        />
      </div>
    </div>
  )
}
