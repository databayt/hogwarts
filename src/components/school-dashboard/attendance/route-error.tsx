"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

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
  const { dictionary } = useDictionary()
  const t = (dictionary as any)?.attendanceHub?.error ?? {}

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Attendance route error:", error)
    }
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <Icons.alertCircle className="text-muted-foreground size-8" />
      <div className="max-w-sm space-y-2">
        <h2 className="text-lg font-semibold">
          {t.title ?? "Something went wrong"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t.description ??
            "This page couldn't load. Try again, or come back in a moment."}
        </p>
        {error.digest && (
          <p className="text-muted-foreground font-mono text-xs" dir="ltr">
            {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="rounded-full">
          {t.retry ?? "Try again"}
        </Button>
        <Button variant="ghost" className="rounded-full" asChild>
          <Link href={`/${params.lang || "ar"}/attendance`}>
            {t.home ?? "Back to attendance"}
          </Link>
        </Button>
      </div>
    </div>
  )
}
