"use client"

import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { FormHeading, FormLayout } from "@/components/form"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

import { TitleForm, type TitleFormRef } from "./form"
import { useTitle } from "./use-title"

interface Props {
  dictionary?: any
}

export default function TitleContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const schoolId = params.id as string
  const formRef = useRef<TitleFormRef>(null)
  const { enableNext, disableNext, setCustomNavigation } = useHostValidation()
  const { data: titleData, loading } = useTitle(schoolId)
  const [currentTitle, setCurrentTitle] = useState("")
  const dict = dictionary?.onboarding || {}

  // Enable/disable next based on title input
  useEffect(() => {
    if (currentTitle.trim().length >= 2) {
      enableNext()
    } else if (titleData?.title) {
      enableNext()
    } else {
      disableNext()
    }
  }, [currentTitle, titleData?.title, enableNext, disableNext])

  // Set up custom navigation to save before going to next
  useEffect(() => {
    const handleNext = async () => {
      try {
        await formRef.current?.saveAndNext()
        router.push(`/onboarding/${schoolId}/description`)
      } catch {
        // Error handled in form
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [schoolId, router, setCustomNavigation])

  if (loading) {
    return (
      <FormLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </FormLayout>
    )
  }

  return (
    <FormLayout>
      <FormHeading
        title={
          (dict.nameYourSchool || "Name your") +
          "\n" +
          (dict.school || "school")
        }
        description={
          dict.schoolNameDescription ||
          "Choose a clear name that families will recognize. You can always change it later."
        }
      />
      <TitleForm
        ref={formRef}
        schoolId={schoolId}
        initialData={titleData || undefined}
        onTitleChange={setCurrentTitle}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
