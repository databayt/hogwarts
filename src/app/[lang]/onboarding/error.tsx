"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Icons } from "@/components/icons"

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Onboarding error:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Icons.alertTriangle className="text-destructive h-6 w-6" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An error occurred during the onboarding process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {process.env.NODE_ENV === "development" && (
            <details className="text-start">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details
              </summary>
              <pre className="bg-muted mt-2 overflow-auto rounded p-2 text-xs">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
          <div className="space-y-2">
            <Button onClick={reset} className="w-full">
              <Icons.refresh className="me-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/onboarding/overview")}
              className="w-full"
            >
              <Icons.home className="me-2 h-4 w-4" />
              Back to Overview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
