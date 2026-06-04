// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * SectionCard — renders a pure section mockup (not inside a paper outline).
 * Used by wizard steps for header, footer, student-info, instructions, etc.
 */

import { cn } from "@/lib/utils"

import type { SlotName } from "../../templates/composition/types"
import { MiniPaperMockup } from "./mini-paper-mockup"

interface SectionCardProps {
  slot: SlotName
  variant: string
  label: string
  description: string
  selected: boolean
  onClick: () => void
}

export function SectionCard({
  slot,
  variant,
  label,
  description,
  selected,
  onClick,
}: SectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-3 rounded-lg border p-4 text-start transition-all",
        selected
          ? "border-primary bg-primary/5 ring-primary/20 ring-2"
          : "border-border hover:border-primary/50 hover:shadow-sm"
      )}
    >
      {/* Pure section preview — compact, fills the card (no A4 page frame) */}
      <div className="bg-card w-full overflow-hidden rounded-md border p-3">
        <MiniPaperMockup slot={slot} variant={variant} />
      </div>

      {/* Label and description */}
      <div className="space-y-0.5">
        <p className={cn("text-sm font-medium", selected && "text-primary")}>
          {label}
        </p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </button>
  )
}
