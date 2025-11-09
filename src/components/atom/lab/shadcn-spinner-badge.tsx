"use client"

import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

/**
 * ShadcnSpinnerBadge - Loading badges with spinners
 *
 * Demonstrates badge variants with integrated loading indicators.
 *
 * @example
 * ```tsx
 * <ShadcnSpinnerBadge />
 * ```
 */
export function ShadcnSpinnerBadge() {
  return (
    <div className="flex items-center gap-2">
      <Badge>
        <Loader2 className="mr-1 size-3 animate-spin" />
        Syncing
      </Badge>
      <Badge variant="secondary">
        <Loader2 className="mr-1 size-3 animate-spin" />
        Updating
      </Badge>
      <Badge variant="outline">
        <Loader2 className="mr-1 size-3 animate-spin" />
        Loading
      </Badge>
    </div>
  )
}
