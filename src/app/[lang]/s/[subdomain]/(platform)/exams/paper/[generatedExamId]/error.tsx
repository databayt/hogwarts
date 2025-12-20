"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Exam paper page error:", error)
  }, [error])

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            <CardTitle>Error Loading Page</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            An error occurred while loading the exam paper page. Please try
            again.
          </p>
          {error.digest && (
            <p className="text-muted-foreground font-mono text-sm">
              Error ID: {error.digest}
            </p>
          )}
          <Button onClick={reset}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  )
}
