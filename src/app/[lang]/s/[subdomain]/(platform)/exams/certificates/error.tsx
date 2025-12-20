"use client"

/**
 * Certificates Error Boundary
 */
import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CertificatesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Certificates error:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="bg-destructive/10 rounded-full p-4">
        <AlertTriangle className="text-destructive h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        An error occurred while loading certificates. Please try again.
      </p>
      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">
          Error ID: {error.digest}
        </p>
      )}
      <Button onClick={reset} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
