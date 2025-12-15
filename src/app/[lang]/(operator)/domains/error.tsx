"use client"

import { useEffect } from "react"
import { Globe, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DomainsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Domains error:", error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Domain Management Error</CardTitle>
          <CardDescription>
            Failed to load domain requests. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground text-sm">{error.message}</p>
            </div>
          )}
          <Button onClick={() => reset()} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry loading domains
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
