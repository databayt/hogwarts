"use client"

import { BadgeCheck, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * ShadcnItemDemo - List item patterns
 *
 * Demonstrates different item layouts for settings and notifications.
 *
 * @example
 * ```tsx
 * <ShadcnItemDemo />
 * ```
 */
export function ShadcnItemDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {/* Setting Item */}
      <div className="border-border flex items-center justify-between rounded-lg border p-4">
        <div className="flex-1">
          <div className="font-medium">Two-factor authentication</div>
          <p className="text-muted-foreground text-sm">
            Verify via email or phone number.
          </p>
        </div>
        <Button size="sm">Enable</Button>
      </div>

      {/* Notification Item */}
      <a
        href="#"
        className="border-border hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
      >
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
          <BadgeCheck className="text-primary size-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">
            Your profile has been verified.
          </div>
        </div>
        <ChevronRight className="text-muted-foreground size-4" />
      </a>
    </div>
  )
}
