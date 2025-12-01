"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function TeachersError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Teachers page error:", error)
  }, [error])

  return (
    <div className="grid gap-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load teachers</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>An unexpected error occurred while loading teacher data.</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error reference: {error.digest}
            </p>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button onClick={reset} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}
