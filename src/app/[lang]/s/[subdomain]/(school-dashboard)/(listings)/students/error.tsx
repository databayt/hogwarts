"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function StudentsError({ error, reset }: ErrorProps) {
  const { dictionary } = useDictionary()
  const d = (dictionary?.school as any)?.students?.errorBoundary

  useEffect(() => {
    console.error("Students page error:", error)
  }, [error])

  return (
    <div className="grid gap-8">
      <Alert variant="destructive">
        <Icons.alertCircle className="h-4 w-4" />
        <AlertTitle>{d?.title || "Unable to load students"}</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            {d?.description ||
              "An unexpected error occurred while loading student data."}
          </p>
          {error.digest && (
            <p className="text-muted-foreground text-xs">
              {d?.errorRef || "Error reference"}: {error.digest}
            </p>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button onClick={reset} variant="outline" className="gap-2">
          <Icons.refresh className="h-4 w-4" />
          {d?.tryAgain || "Try again"}
        </Button>
      </div>
    </div>
  )
}
