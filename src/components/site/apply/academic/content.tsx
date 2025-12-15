"use client"

import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { GraduationCap } from "lucide-react"

import { useLocale } from "@/components/internationalization/use-locale"

import { useApplication } from "../application-context"
import type { AcademicStepData } from "../types"
import { useApplyValidation } from "../validation-context"
import { ACADEMIC_STEP_CONFIG } from "./config"
import { AcademicForm } from "./form"
import type { AcademicFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function AcademicContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const subdomain = params.subdomain as string
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplication()
  const academicFormRef = useRef<AcademicFormRef>(null)

  const initialData = getStepData("academic")

  const onNext = useCallback(async () => {
    if (academicFormRef.current) {
      try {
        await academicFormRef.current.saveAndNext()
        router.push(`/${locale}/s/${subdomain}/apply/${id}/documents`)
      } catch (error) {
        console.error("Error saving academic step:", error)
      }
    }
  }, [locale, subdomain, id, router])

  useEffect(() => {
    const academicData = session.formData.academic

    // Only applyingForClass is required
    const isValid = academicData?.applyingForClass

    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.academic,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  const dict = ((dictionary as Record<string, Record<string, string>> | null)
    ?.apply?.academic ?? {}) as Record<string, string>

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start gap-4">
          <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <GraduationCap className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title ||
                (isRTL
                  ? ACADEMIC_STEP_CONFIG.labelAr
                  : ACADEMIC_STEP_CONFIG.label)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description ||
                (isRTL
                  ? ACADEMIC_STEP_CONFIG.descriptionAr
                  : ACADEMIC_STEP_CONFIG.description)}
            </p>
          </div>
        </div>

        <AcademicForm
          ref={academicFormRef}
          initialData={initialData as AcademicStepData}
          dictionary={dictionary}
        />
      </div>
    </div>
  )
}
