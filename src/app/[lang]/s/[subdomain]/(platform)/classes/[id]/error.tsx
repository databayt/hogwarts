"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ClassDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Class detail page error:", error)
  }, [error])

  return (
    <div className="grid gap-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load class details</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>An unexpected error occurred while loading the class details.</p>
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
        <Button variant="ghost" asChild className="gap-2">
          <Link href="../">
            <ArrowLeft className="h-4 w-4" />
            Back to classes
          </Link>
        </Button>
      </div>
    </div>
  )
}
