"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export default function OnboardingStepError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    console.error("Onboarding step error:", error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          An error occurred while loading this step. You can try again or go
          back to the previous step.
        </p>
        {error.digest && (
          <p className="text-muted-foreground font-mono text-xs">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  )
}
