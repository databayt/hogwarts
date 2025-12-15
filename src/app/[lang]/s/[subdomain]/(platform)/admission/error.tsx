"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function AdmissionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Admission Error]", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <AlertTriangle className="text-destructive h-12 w-12" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md text-center">
        An error occurred while loading admission data. Please try again.
      </p>
      {error.digest && (
        <p className="text-muted-foreground text-xs">
          Error ID: {error.digest}
        </p>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
