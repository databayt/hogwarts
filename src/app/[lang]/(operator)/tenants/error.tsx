"use client"

import { useEffect } from "react"
import { Building2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function TenantsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Tenants error:", error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
            <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle>Tenant Management Error</CardTitle>
          <CardDescription>
            Unable to load tenant information. Please try again.
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
            Retry loading tenants
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
