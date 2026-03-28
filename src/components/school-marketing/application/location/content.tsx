"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import type { LocationStepData } from "../types"
import { getApplyStepDict } from "../utils"
import { useApplyValidation } from "../validation-context"
import { LOCATION_STEP_CONFIG } from "./config"
import { LocationForm } from "./form"
import type { LocationFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function LocationContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale, isRTL } = useLocale()
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const locationFormRef = useRef<LocationFormRef>(null)

  const initialData = getStepData("location")

  // Location doesn't have a dedicated step in the dictionary steps, use config fallback
  const stepDict = getApplyStepDict(dictionary, "location")

  const onNext = useCallback(async () => {
    if (locationFormRef.current) {
      try {
        await locationFormRef.current.saveAndNext()
        router.push(`/${locale}/application/${id}/guardian`)
      } catch (error) {
        console.error("Error saving location step:", error)
      }
    }
  }, [locale, id, router])

  useEffect(() => {
    const locationData = session.formData.location

    const isValid =
      locationData?.address &&
      locationData?.city &&
      locationData?.state &&
      locationData?.country

    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.location,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  return (
    <FormLayout>
      <FormHeading
        title={stepDict.title || LOCATION_STEP_CONFIG.label(isRTL)}
        description={
          stepDict.description || LOCATION_STEP_CONFIG.description(isRTL)
        }
      />
      <LocationForm
        ref={locationFormRef}
        initialData={initialData as LocationStepData}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
