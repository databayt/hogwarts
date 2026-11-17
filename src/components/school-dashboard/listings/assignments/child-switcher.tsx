// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"

import { cn } from "@/lib/utils"

import type { GuardianChild } from "./access"

/**
 * A guardian with more than one child picks whose homework to read. Plain
 * links (`?child=<id>`) so it stays a server component and works without
 * JavaScript; every pill is a 44px tap target and the row wraps on a phone.
 */
export function ChildSwitcher({
  items,
  activeId,
  lang,
  label,
  basePath = "/assignments",
}: {
  items: readonly GuardianChild[]
  activeId: string
  lang: string
  label: string
  basePath?: string
}) {
  if (items.length < 2) return null
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground me-1 text-sm">{label}</span>
      {items.map((child) => {
        const active = child.id === activeId
        return (
          <Link
            key={child.id}
            href={`/${lang}${basePath}?child=${encodeURIComponent(child.id)}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors",
              "focus-visible:ring-ring outline-none focus-visible:ring-2",
              active
                ? "border-foreground bg-foreground text-background"
                : "hover:bg-muted"
            )}
          >
            {child.name}
          </Link>
        )
      })}
    </nav>
  )
}
