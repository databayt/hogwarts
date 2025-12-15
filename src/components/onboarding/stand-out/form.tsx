"use client"

import React from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface StandOutFormProps {
  onContinue?: () => void
  isLoading?: boolean
}

export function StandOutForm({
  onContinue,
  isLoading = false,
}: StandOutFormProps) {
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
            Continuing...
          </>
        ) : (
          <>
            Continue to School Setup
            <ArrowRight className="ms-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}

export default StandOutForm
