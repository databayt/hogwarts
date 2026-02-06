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

export default function OperatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Operator lab error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Icons.alertCircle className="text-destructive h-6 w-6" />
          </div>
          <CardTitle>Something went wrong!</CardTitle>
          <CardDescription>
            An error occurred while loading the operator dashboard. This has
            been logged and our team will investigate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground font-mono text-sm">
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p className="text-muted-foreground mt-1 text-xs">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => reset()}
              className="flex-1"
              variant="default"
            >
              <Icons.refresh className="me-2 h-4 w-4" />
              Try again
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              className="flex-1"
              variant="outline"
            >
              Go to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
