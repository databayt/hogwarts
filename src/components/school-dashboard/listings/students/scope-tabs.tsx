"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { parseAsStringLiteral, useQueryState } from "nuqs"

import type { ArchiveScope } from "@/lib/archive-scope"
import { cn } from "@/lib/utils"

interface ScopeTabsProps {
  counts: Record<ArchiveScope, number>
  labels: Record<ArchiveScope, string>
  className?: string
}

const SCOPES = ["active", "archived", "all"] as const

export function ScopeTabs({ counts, labels, className }: ScopeTabsProps) {
  const [scope, setScope] = useQueryState(
    "scope",
    parseAsStringLiteral(SCOPES)
      .withDefault("active")
      .withOptions({ history: "replace", shallow: false })
  )

  return (
    <div className={cn("border-b", className)}>
      <nav className="flex items-center gap-6">
        {SCOPES.map((s) => {
          const isActive = scope === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={cn(
                "hover:text-primary relative px-1 pb-3 text-sm whitespace-nowrap transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground font-medium"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {labels[s]}
              <span className="text-muted-foreground ms-1.5 text-xs">
                ({counts[s]})
              </span>
              {isActive && (
                <span className="bg-primary absolute start-0 end-0 bottom-0 h-0.5" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
