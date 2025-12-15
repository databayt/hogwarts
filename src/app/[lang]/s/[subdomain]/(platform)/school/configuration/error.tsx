"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Configuration error:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-6 w-6" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            Failed to load school configuration. This might be a temporary
            issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
