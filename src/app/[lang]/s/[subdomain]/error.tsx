"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SubdomainError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // Sentry.captureException(error)
    } else {
      console.error("Subdomain layout error:", error)
    }
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <Icons.alertCircle className="text-muted-foreground h-10 w-10" />
        <h2 className="text-xl font-semibold">Temporarily unavailable</h2>
        <p className="text-muted-foreground max-w-sm">
          We&apos;re having trouble connecting. This usually resolves in a few
          seconds.
        </p>
        {error.digest && (
          <p className="text-muted-foreground text-xs">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset} variant="outline" className="gap-2">
        <Icons.refresh className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
