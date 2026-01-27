"use client"

import { useEffect } from "react"
import { Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Icons } from "@/components/icons"

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Billing error:", error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Receipt className="text-destructive h-6 w-6" />
          </div>
          <CardTitle>Billing Error</CardTitle>
          <CardDescription>
            Unable to load billing information. This may be a temporary issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground text-sm">{error.message}</p>
            </div>
          )}
          <Button onClick={() => reset()} className="w-full">
            <Icons.refresh className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
