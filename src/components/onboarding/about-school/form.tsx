"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface AboutSchoolFormProps {
  onContinue?: () => void
  isLoading?: boolean
}

export function AboutSchoolForm({
  onContinue,
  isLoading = false,
}: AboutSchoolFormProps) {
  const { dictionary } = useDictionary()

  const startingText =
    dictionary?.marketing?.onboarding?.aboutSchool?.starting || "Starting..."
  const startSetupText =
    dictionary?.marketing?.onboarding?.aboutSchool?.startSetup || "Start Setup"

  return (
    <div className="flex justify-center pt-4">
      <Button
        onClick={onContinue}
        disabled={isLoading}
        size="lg"
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <div className="me-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
            {startingText}
          </>
        ) : (
          <>
            {startSetupText}
            <Icons.arrowRight className="ms-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}

export default AboutSchoolForm
