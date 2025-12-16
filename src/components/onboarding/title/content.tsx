"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Globe } from "lucide-react"

import { generateSubdomain } from "@/lib/subdomain"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/components/internationalization/use-locale"
import { FORM_LIMITS } from "@/components/onboarding/config.client"
import { useHostValidation } from "@/components/onboarding/host-validation-context"
import { useListing } from "@/components/onboarding/use-listing"

import { TitleCard } from "./card"
import { TitleForm, type TitleFormRef } from "./form"
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
  const titleFormRef = useRef<TitleFormRef>(null)
  const { listing } = useListing()
  const { data: titleData, loading } = useTitle(schoolId)
  const [generatedSubdomain, setGeneratedSubdomain] = useState<string>("")
  const [currentFormTitle, setCurrentFormTitle] = useState<string>("")

  const dict = dictionary?.onboarding || {}
  const currentTitle =
    currentFormTitle || titleData?.title || listing?.name || ""

  const handleTitleChange = useCallback((title: string) => {
    setCurrentFormTitle(title)
  }, [])

  const onNext = useCallback(async () => {
    console.log("🚀 [TITLE CONTENT] onNext called", {
      schoolId,
      hasFormRef: !!titleFormRef.current,
      timestamp: new Date().toISOString(),
    })

    if (titleFormRef.current) {
      try {
        await titleFormRef.current.saveAndNext()
        console.log("✅ [TITLE CONTENT] saveAndNext completed successfully")

        // Navigate to the next step after successful save
        console.log("🦭 [TITLE CONTENT] Navigating to description step")
        router.push(`/onboarding/${schoolId}/description`)
      } catch (error) {
        console.error("❌ [TITLE CONTENT] Error during saveAndNext:", error)
      }
    } else {
      console.warn("⚠️ [TITLE CONTENT] No form ref available")
    }
  }, [schoolId])

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
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:justify-between lg:gap-20">
          {/* Left side - Text content skeleton */}
          <div className="w-full space-y-6 lg:max-w-md">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>

            {/* Form skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-48" />
            </div>

            {/* Subdomain preview skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>

          {/* Right side - Card skeleton */}
          <div className="w-full space-y-4 lg:max-w-md">
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:justify-between lg:gap-20">
          {/* Left side - Text content */}
          <div
            className={`w-full space-y-3 sm:space-y-4 lg:max-w-md ${isRTL ? "text-right" : "text-left"}`}
          >
            <h1 className="text-3xl font-bold">
              {dict.whatsYourSchoolName || "What's your school's name?"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {dict.schoolNameDescription ||
                "This will be your school's official name in the system."}
            </p>
          </div>

          {/* Right side - Form */}
          <div className="w-full lg:max-w-md">
            <TitleForm
              ref={titleFormRef}
              schoolId={schoolId}
              initialData={{
                title: currentTitle,
                subdomain: titleData?.subdomain || "",
              }}
              onTitleChange={handleTitleChange}
              dictionary={dictionary}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
