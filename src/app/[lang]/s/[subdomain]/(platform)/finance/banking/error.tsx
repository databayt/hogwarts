"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function BankingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Banking module error:", error)
  }, [error])

  return (
    <div className="layout-container flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
          <CardDescription>
            {error.message ||
              "An error occurred while loading your banking information."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {error.digest && (
              <>
                Error ID: <code className="text-xs">{error.digest}</code>
              </>
            )}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/banking")}
          >
            Go to Dashboard
          </Button>
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
