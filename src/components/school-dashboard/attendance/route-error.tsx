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

/**
 * Generic per-route error boundary for attendance sub-routes. Each subroute
 * re-exports this as its `error.tsx` so a failure in one page is localized to
 * that page instead of replacing the whole attendance shell.
 */
export default function AttendanceRouteError({ error, reset }: ErrorProps) {
  const params = useParams<{ lang: string }>()

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Attendance route error:", error)
    }
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 p-8">
      <Alert variant="destructive" className="max-w-md">
        <Icons.alertCircle className="h-4 w-4" />
        <AlertTitle>Attendance Error</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>Unable to load this page. Please try again.</p>
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
          <Link href={`/${params.lang || "en"}/attendance`}>
            <Icons.home className="h-4 w-4" />
            Back to attendance
          </Link>
        </Button>
      </div>
    </div>
  )
}
