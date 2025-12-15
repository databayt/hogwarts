"use client"

import React from "react"
import { CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

interface FinishSetupFormProps {
  onContinue?: () => void
  isLoading?: boolean
}

export function FinishSetupForm({
  onContinue,
  isLoading = false,
}: FinishSetupFormProps) {
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
            Finishing...
          </>
        ) : (
          <>
            Complete Setup
            <CheckCircle className="ms-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}

export default FinishSetupForm
