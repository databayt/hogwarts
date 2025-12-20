"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { generateSubdomain } from "@/lib/subdomain"
import { Skeleton } from "@/components/ui/skeleton"
import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"
import { FORM_LIMITS } from "@/components/onboarding/config.client"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

// TEMPORARILY: Removed useListing to isolate the 500 error
// import { useListing } from "@/components/onboarding/use-listing"

// TEMPORARILY: Removed TitleCard to simplify
// import { TitleCard } from "./card"
// TEMPORARILY: Removed TitleForm to isolate the 500 error (imports from ./actions)
// import { TitleForm, type TitleFormRef } from "./form"
import { useTitle } from "./use-title"

interface Props {
  dictionary?: any
}

export default function TitleContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const schoolId = params.id as string
  const { isRTL } = useLocale()
  const { enableNext, disableNext, setCustomNavigation } = useHostValidation()
  // TEMPORARILY: Removed TitleForm ref
  // const titleFormRef = useRef<TitleFormRef>(null)
  // TEMPORARILY: Removed useListing
  // const { listing } = useListing()
  const { data: titleData, loading, error } = useTitle(schoolId)
  const [generatedSubdomain, setGeneratedSubdomain] = useState<string>("")
  const [currentFormTitle, setCurrentFormTitle] = useState<string>("")

  const dict = dictionary?.onboarding || {}
  // TEMPORARILY: Simplified - removed listing?.name
  const currentTitle = currentFormTitle || titleData?.title || ""

  const handleTitleChange = useCallback((title: string) => {
    setCurrentFormTitle(title)
  }, [])

  // TEMPORARILY: Simplified onNext - just navigate
  const onNext = useCallback(async () => {
    console.log("🚀 [TITLE CONTENT] onNext called - MINIMAL VERSION", {
      schoolId,
      timestamp: new Date().toISOString(),
    })
    router.push(`/onboarding/${schoolId}/description`)
  }, [schoolId, router])

  // Enable/disable next button based on title and set custom navigation
  useEffect(() => {
    const trimmedLength = currentTitle.trim().length
    if (
      trimmedLength >= FORM_LIMITS.TITLE_MIN_LENGTH &&
      trimmedLength <= FORM_LIMITS.TITLE_MAX_LENGTH
    ) {
      enableNext()
      setCustomNavigation({
        onNext,
      })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [currentTitle, enableNext, disableNext, setCustomNavigation, onNext])

  // Generate subdomain preview
  useEffect(() => {
    if (currentTitle.trim().length >= FORM_LIMITS.TITLE_MIN_LENGTH) {
      const subdomain = generateSubdomain(currentTitle)
      setGeneratedSubdomain(subdomain)
    } else {
      setGeneratedSubdomain("")
    }
  }, [currentTitle])

  if (loading) {
    return (
      <div className="w-full">
        <FormLayout>
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </FormLayout>
      </div>
    )
  }

  // TEMPORARILY: Show error state clearly
  if (error) {
    return (
      <div className="w-full p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">
            Error Loading Title
          </h2>
          <p className="mt-2 text-red-600">{error}</p>
          <p className="mt-4 text-sm text-gray-600">
            Debug: schoolId = {schoolId}
          </p>
        </div>
      </div>
    )
  }

  // TEMPORARILY: Minimal render to test if page loads
  return (
    <div className="w-full">
      <FormLayout>
        <FormHeading
          title={dict.whatsYourSchoolName || "What's your school's name?"}
          description={
            dict.schoolNameDescription ||
            "This will be your school's official name in the system."
          }
        />
        {/* TEMPORARILY: Minimal content instead of TitleForm */}
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">
            ✅ Title Page Loaded Successfully!
          </h3>
          <p className="mt-2 text-gray-600">School ID: {schoolId}</p>
          <p className="mt-1 text-gray-600">
            Title Data: {JSON.stringify(titleData)}
          </p>
          <p className="mt-1 text-gray-600">
            Current Title: {currentTitle || "(none)"}
          </p>
          <p className="mt-1 text-gray-600">
            Generated Subdomain: {generatedSubdomain || "(none)"}
          </p>
        </div>
      </FormLayout>
    </div>
  )
}
