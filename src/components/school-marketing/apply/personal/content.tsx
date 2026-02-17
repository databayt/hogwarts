"use client"

import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { User } from "lucide-react"

import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import type { PersonalStepData } from "../types"
import { useApplyValidation } from "../validation-context"
import { PERSONAL_STEP_CONFIG } from "./config"
import { PersonalForm } from "./form"
import type { PersonalFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function PersonalContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const subdomain = params.subdomain as string
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const personalFormRef = useRef<PersonalFormRef>(null)

  const initialData = getStepData("personal")

  const onNext = useCallback(async () => {
    if (personalFormRef.current) {
      try {
        await personalFormRef.current.saveAndNext()
        router.push(`/${locale}/apply/${id}/contact`)
      } catch (error) {
        console.error("Error saving personal step:", error)
      }
    }
  }, [locale, subdomain, id, router])

  // Enable/disable next button based on form validity
  useEffect(() => {
    const personalData = session.formData.personal

    // Check if required fields are filled
    const isValid =
      personalData?.firstName &&
      personalData?.lastName &&
      personalData?.dateOfBirth &&
      personalData?.gender &&
      personalData?.nationality

    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.personal,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  const dict = ((dictionary as Record<string, Record<string, string>> | null)
    ?.apply?.personal ?? {}) as Record<string, string>

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <User className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title || PERSONAL_STEP_CONFIG.label}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description || PERSONAL_STEP_CONFIG.description}
            </p>
          </div>
        </div>

        {/* Form */}
        <PersonalForm
          ref={personalFormRef}
          initialData={initialData as PersonalStepData}
          dictionary={dictionary}
        />
      </div>
    </div>
  )
}
