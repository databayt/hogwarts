"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface FinishSetupFormProps {
  onContinue?: () => void
  isLoading?: boolean
}

export function FinishSetupForm({
  onContinue,
  isLoading = false,
}: FinishSetupFormProps) {
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
            {dictionary?.marketing?.onboarding?.finishSetup?.finishing ||
              "Finishing"}
            ...
          </>
        ) : (
          <>
            {dictionary?.marketing?.onboarding?.finishSetup?.completeSetup ||
              "Complete Setup"}
            <Icons.checkCircle className="ms-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}

export default FinishSetupForm
