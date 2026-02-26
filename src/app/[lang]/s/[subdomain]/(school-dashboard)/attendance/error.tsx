"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AttendanceError({ error, reset }: ErrorProps) {
  const params = useParams<{ lang: string }>()

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // Sentry.captureException(error)
    } else {
      console.error("Attendance error:", error)
    }
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 p-8">
      <Alert variant="destructive" className="max-w-md">
        <Icons.alertCircle className="h-4 w-4" />
        <AlertTitle>Attendance Error</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>Unable to load attendance data. Please try again.</p>
          {error.digest && (
            <p className="text-muted-foreground text-xs">
              Error reference: {error.digest}
            </p>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button onClick={reset} variant="outline" className="gap-2">
          <Icons.refresh className="h-4 w-4" />
          Try again
        </Button>
        <Button variant="ghost" className="gap-2" asChild>
          <Link href={`/${params.lang || "en"}`}>
            <Icons.home className="h-4 w-4" />
            Go home
          </Link>
        </Button>
      </div>
    </div>
  )
}
