"use client"

import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

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
    <div className="border-border flex w-full flex-col items-center justify-center space-y-6 rounded-lg border p-12 text-center md:p-16">
      <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
        <Loader2 className="text-primary size-6 animate-spin" />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Processing your request</h3>
        <p className="text-muted-foreground text-sm">
          Please wait while we process your request. Do not refresh the page.
        </p>
      </div>

      <Button variant="outline" size="sm">
        Cancel
      </Button>
    </div>
  )
}
