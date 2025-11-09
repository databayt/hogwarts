"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

/**
 * ShadcnSpinnerEmpty - Loading state with cancellation
 *
 * Loading state interface with spinner icon and cancel button.
 *
 * @example
 * ```tsx
 * <ShadcnSpinnerEmpty />
 * ```
 */
export function ShadcnSpinnerEmpty() {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-6 rounded-lg border border-border p-12 text-center md:p-16">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Processing your request</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we process your request. Do not refresh the page.
        </p>
      </div>

      <Button variant="outline" size="sm">
        Cancel
      </Button>
    </div>
  )
}
