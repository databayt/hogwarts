"use client"

import { BadgeCheck, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * ItemDemo - List item patterns
 *
 * Demonstrates different item layouts for settings and notifications.
 *
 * @example
 * ```tsx
 * <ItemDemo />
 * ```
 */
export function ItemDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {/* Setting Item */}
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div className="flex-1">
          <div className="font-medium">Two-factor authentication</div>
          <p className="text-sm text-muted-foreground">
            Verify via email or phone number.
          </p>
        </div>
        <Button size="sm">Enable</Button>
      </div>

      {/* Notification Item */}
      <a
        href="#"
        className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <BadgeCheck className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">
            Your profile has been verified.
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </a>
    </div>
  )
}
