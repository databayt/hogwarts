"use client"

import React from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface AboutSchoolFormProps {
  onContinue?: () => void
  isLoading?: boolean
}

export function AboutSchoolForm({
  onContinue,
  isLoading = false,
}: AboutSchoolFormProps) {
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
            Starting...
          </>
        ) : (
          <>
            Start Setup
            <ArrowRight className="ms-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}

export default AboutSchoolForm
