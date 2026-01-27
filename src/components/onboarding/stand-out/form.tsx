"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface StandOutFormProps {
  onContinue?: () => void
  isLoading?: boolean
}

export function StandOutForm({
  onContinue,
  isLoading = false,
}: StandOutFormProps) {
  const { dictionary } = useDictionary()

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
            {dictionary?.marketing?.onboarding?.standOut?.continuing ||
              "Continuing"}
            ...
          </>
        ) : (
          <>
            {dictionary?.marketing?.onboarding?.standOut?.continueSetup ||
              "Continue to School Setup"}
            <Icons.arrowRight className="ms-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}

export default StandOutForm
