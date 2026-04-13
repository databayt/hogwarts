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

  const locationIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      className="inline-block align-text-bottom"
    >
      <path
        fill="currentColor"
        d="M12 8.25a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 1.25a.75.75 0 0 1 .75.75v1.282a8.75 8.75 0 0 1 7.968 7.968H22a.75.75 0 0 1 0 1.5h-1.282a8.75 8.75 0 0 1-7.968 7.968V22a.75.75 0 0 1-1.5 0v-1.282a8.75 8.75 0 0 1-7.968-7.968H2a.75.75 0 0 1 0-1.5h1.282a8.75 8.75 0 0 1 7.968-7.968V2a.75.75 0 0 1 .75-.75M4.75 12a7.25 7.25 0 1 0 14.5 0a7.25 7.25 0 0 0-14.5 0"
        clipRule="evenodd"
      />
    </svg>
  )

  const renderDescription = (text: string) => {
    const parts = text.split("{locationIcon}")
    if (parts.length === 1) return text
    return (
      <>
        {parts[0]}
        {locationIcon}
        {parts[1]}
      </>
    )
  }

  const onNext = useCallback(async () => {
    if (locationFormRef.current) {
      try {
        await locationFormRef.current.saveAndNext()
        router.push(`/${locale}/application/${id}/academic`)
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
        description={renderDescription(
          stepDict.description || LOCATION_STEP_CONFIG.description(isRTL)
        )}
      />
      <LocationForm
        ref={locationFormRef}
        initialData={initialData as LocationStepData}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
