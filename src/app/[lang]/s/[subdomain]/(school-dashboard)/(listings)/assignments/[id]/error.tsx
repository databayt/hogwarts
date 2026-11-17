"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AssignmentDetailError({ error, reset }: ErrorProps) {
  const dictionary = useDictionaryFallback()
  const t = (dictionary?.school?.assignments as any)?.errors ?? {}
  useEffect(() => {
    console.error("Assignment detail page error:", error)
  }, [error])

  return (
    <div className="grid gap-8">
      <Alert variant="destructive">
        <Icons.alertCircle className="h-4 w-4" />
        <AlertTitle>{t.detailTitle ?? "Unable to load assignment details"}</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            {t.detailBody ??
              "An unexpected error occurred while loading the assignment details."}
          </p>
          {error.digest && (
            <p className="text-muted-foreground text-xs">
              {t.reference ?? "Error reference"}: {error.digest}
            </p>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button onClick={reset} variant="outline" className="gap-2">
          <Icons.refresh className="h-4 w-4" />
          {t.retry ?? "Try again"}
        </Button>
        <Button variant="ghost" asChild className="gap-2">
          <Link href="../" className="rtl:[&_svg]:rotate-180">
            <Icons.arrowLeft className="h-4 w-4" />
            {t.backToList ?? "Back to assignments"}
          </Link>
        </Button>
      </div>
    </div>
  )
}
