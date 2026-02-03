"use client"

import { useEffect } from "react"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GradeDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Grade detail page error:", error)
  }, [error])

  return (
    <div className="grid gap-8">
      <Alert variant="destructive">
        <Icons.alertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load grade details</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>An unexpected error occurred while loading the grade details.</p>
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
        <Button variant="ghost" asChild className="gap-2">
          <Link href="../">
            <Icons.arrowLeft className="h-4 w-4" />
            Back to grades
          </Link>
        </Button>
      </div>
    </div>
  )
}
