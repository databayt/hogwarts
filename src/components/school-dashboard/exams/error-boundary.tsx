"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CircleAlert, House, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ExamErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
  backHref?: string
  backLabel?: string
}

export function ExamErrorBoundary({
  error,
  reset,
  title = "Unable to load content",
  description = "An unexpected error occurred while loading this page.",
  backHref,
  backLabel = "Back to Exams",
}: ExamErrorBoundaryProps) {
  useEffect(() => {
    console.error("Exam module error:", error)
  }, [error])

  return (
    <div className="grid gap-8">
      <Alert variant="destructive">
        <CircleAlert className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{description}</p>
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
        {backHref && (
          <Button asChild variant="ghost" className="gap-2">
            <Link href={backHref}>
              <House className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
