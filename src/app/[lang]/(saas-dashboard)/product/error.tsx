"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Icons } from "@/components/icons"

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Products error:", error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Icons.alertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle>Products Error</CardTitle>
          <CardDescription>
            We couldn&apos;t load the products data. Please try refreshing the
            page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button onClick={() => reset()} className="w-full">
              <Icons.refresh className="me-2 h-4 w-4" />
              Refresh products
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Reload page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
