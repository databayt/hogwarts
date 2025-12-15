"use client"

import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users } from "lucide-react"

import { useLocale } from "@/components/internationalization/use-locale"

import { useApplication } from "../application-context"
import type { GuardianStepData } from "../types"
import { useApplyValidation } from "../validation-context"
import { GUARDIAN_STEP_CONFIG } from "./config"
import { GuardianForm } from "./form"
import type { GuardianFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function GuardianContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const subdomain = params.subdomain as string
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplication()
  const guardianFormRef = useRef<GuardianFormRef>(null)

  const initialData = getStepData("guardian")

  const onNext = useCallback(async () => {
    if (guardianFormRef.current) {
      try {
        await guardianFormRef.current.saveAndNext()
        router.push(`/${locale}/s/${subdomain}/apply/${id}/academic`)
      } catch (error) {
        console.error("Error saving guardian step:", error)
      }
    }
  }, [locale, subdomain, id, router])

  useEffect(() => {
    const guardianData = session.formData.guardian

    // Father and mother names are required
    const isValid = guardianData?.fatherName && guardianData?.motherName

    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.guardian,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  const dict = ((dictionary as Record<string, Record<string, string>> | null)
    ?.apply?.guardian ?? {}) as Record<string, string>

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start gap-4">
          <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <Users className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title ||
                (isRTL
                  ? GUARDIAN_STEP_CONFIG.labelAr
                  : GUARDIAN_STEP_CONFIG.label)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description ||
                (isRTL
                  ? GUARDIAN_STEP_CONFIG.descriptionAr
                  : GUARDIAN_STEP_CONFIG.description)}
            </p>
          </div>
        </div>

        <GuardianForm
          ref={guardianFormRef}
          initialData={initialData as GuardianStepData}
          dictionary={dictionary}
        />
      </div>
    </div>
  )
}
