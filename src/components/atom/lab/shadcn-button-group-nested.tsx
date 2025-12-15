"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * ShadcnButtonGroupNested - Nested button groups demonstration
 *
 * Shows nested button groups with numbered buttons and navigation arrows.
 *
 * @example
 * ```tsx
 * <ShadcnButtonGroupNested />
 * ```
 */
export function ShadcnButtonGroupNested() {
  return (
    <div className="flex gap-2">
      <div className="flex gap-1">
        <Button variant="outline" size="sm">
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          3
        </Button>
      </div>

      <div className="flex gap-1">
        <Button variant="outline" size="icon" aria-label="Previous">
          <ArrowLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Next">
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
