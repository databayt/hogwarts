"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export default function BankingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { dictionary } = useDictionary()
  const c = dictionary?.finance?.common

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Banking module error:", error)
  }, [error])

  return (
    <div className="layout-container flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icons.alertTriangle className="text-destructive h-5 w-5" />
            <CardTitle>
              {c?.errorTitle || "Unable to load finance data"}
            </CardTitle>
          </div>
          <CardDescription>
            {error.message ||
              c?.errorDescription ||
              "An unexpected error occurred while loading finance information."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {error.digest && (
              <>
                {c?.errorReference || "Error reference"}:{" "}
                <code className="text-xs">{error.digest}</code>
              </>
            )}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/banking")}
          >
            {c?.goToDashboard || "Go to Dashboard"}
          </Button>
          <Button onClick={reset}>
            <Icons.refresh className="me-2 h-4 w-4" />
            {c?.tryAgain || "Try again"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
