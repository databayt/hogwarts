"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Props {
  message: string
  retryLabel: string
  onRetry?: () => void
}

export function TransportationErrorBoundary({
  message,
  retryLabel,
  onRetry,
}: Props) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} type="button">
          {retryLabel}
        </Button>
      ) : null}
    </Card>
  )
}
