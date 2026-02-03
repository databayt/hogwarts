"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SalesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Sales page error:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="text-destructive flex items-center gap-2">
        <Icons.alertCircle className="h-6 w-6" />
        <h2 className="text-lg font-semibold">Something went wrong</h2>
      </div>
      <p className="text-muted-foreground max-w-md text-center">
        {error.message || "An unexpected error occurred while loading leads."}
      </p>
      {error.digest && (
        <p className="text-muted-foreground text-xs">
          Error ID: {error.digest}
        </p>
      )}
      <Button onClick={reset} variant="outline" className="gap-2">
        <Icons.refresh className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
