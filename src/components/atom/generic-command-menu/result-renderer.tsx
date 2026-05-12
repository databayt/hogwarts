"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { ChevronRight } from "lucide-react"

import { kindIconMap } from "./kind-icon-map"
import { SpotlightItem } from "./spotlight-dialog"
import type { SpotlightGroupKind, SpotlightResult } from "./types"

interface SpotlightResultRowProps {
  result: SpotlightResult
  /** Translated entity-kind label for the chip (e.g. "Student" / "طالب"). */
  kindLabel: string
  /** Active locale; prepended to every `result.href` (clean URLs only). */
  locale: string
  onSelect: (result: SpotlightResult) => void
}

/**
 * Render a single dynamic search result. The icon comes from `kindIconMap`,
 * the label is the entity's stored name (no per-keystroke translation), and
 * the kind-chip is dictionary-translated by the caller.
 *
 * The `value` prop given to `cmdk` includes label + secondary + kind so
 * cmdk's built-in fuzzy matcher can rank results alongside static items.
 */
export function SpotlightResultRow({
  result,
  kindLabel,
  locale,
  onSelect,
}: SpotlightResultRowProps) {
  const Icon = kindIconMap[result.kind]
  const localizedHref = `/${locale}${result.href}`
  // cmdk uses `value` as a search hash; include all the strings the user
  // might have typed so the row stays visible after the server fetch.
  const value = [
    result.kind,
    result.label,
    result.secondaryLabel ?? "",
    kindLabel,
  ]
    .join(" ")
    .toLowerCase()

  return (
    <SpotlightItem
      value={value}
      onSelect={() => onSelect({ ...result, href: localizedHref })}
    >
      <div data-slot="icon-wrapper">
        <Icon className="size-5" />
      </div>
      <div className="flex flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span dir="auto">{result.label}</span>
          <KindChip>{kindLabel}</KindChip>
        </span>
        {(result.secondaryLabel || result.breadcrumb?.length) && (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            {result.secondaryLabel && (
              <span dir="auto">{result.secondaryLabel}</span>
            )}
            {result.breadcrumb?.map((crumb, idx) => (
              <React.Fragment key={`${result.id}-crumb-${idx}`}>
                {(result.secondaryLabel || idx > 0) && (
                  <ChevronRight className="size-3 rtl:rotate-180" />
                )}
                <span dir="auto">{crumb}</span>
              </React.Fragment>
            ))}
          </span>
        )}
      </div>
    </SpotlightItem>
  )
}

function KindChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase">
      {children}
    </span>
  )
}

/** Helper for callers that need to look up the translated kind label. */
export function getKindLabel(
  kindLabels: Record<string, string> | undefined,
  kind: SpotlightGroupKind
): string {
  return kindLabels?.[kind] ?? kind
}
