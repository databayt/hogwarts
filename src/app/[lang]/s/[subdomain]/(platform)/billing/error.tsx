"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BillingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (Sentry)
    console.error("Billing page error:", error)
  }, [error])

  return (
    <div className="grid gap-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load billing information</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            {error.message === "User not found"
              ? "Your user account could not be found. Please try logging out and back in."
              : error.message?.includes("Stripe")
                ? "Unable to connect to the payment service. Please try again in a few moments."
                : "An unexpected error occurred while loading your billing information."}
          </p>
          {error.digest && (
            <p className="text-muted-foreground text-xs">
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
        <Button variant="ghost" asChild>
          <a href="/en/support">Contact Support</a>
        </Button>
      </div>
    </div>
  )
}
