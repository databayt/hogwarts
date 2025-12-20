"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Globe } from "lucide-react"

import { generateSubdomain } from "@/lib/subdomain"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FormHeading, FormLayout } from "@/components/form"
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
      </FormLayout>
    </div>
  )
}
