"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export interface PageNavItem {
  name: string
  href: string
  hidden?: boolean
  exact?: boolean
  matchPrefix?: string
  badge?: number
}

interface PageNavProps extends React.HTMLAttributes<HTMLDivElement> {
  pages: PageNavItem[]
  defaultPage?: PageNavItem
}

export function PageNav({
  pages,
  defaultPage,
  className,
  ...props
}: PageNavProps) {
  const pathname = usePathname()

  const normalizedPath = pathname.replace(/\/$/, "")

  // Find the best matching page to avoid highlighting multiple links
  const allVisible = [
    ...(defaultPage ? [defaultPage] : []),
    ...pages.filter((p) => !p.hidden),
  ]

  // Score each page: exact match = 2, prefix match = 1, no match = 0
  // Only the highest-scoring page (with longest href on tie) gets highlighted
  const scored = allVisible.map((page) => {
    const normalizedHref = page.href.replace(/\/$/, "")
    if (normalizedPath === normalizedHref)
      return { page, score: 2, len: normalizedHref.length }

    if (page.exact) return { page, score: 0, len: 0 }

    if (page.matchPrefix) {
      const normalizedPrefix = page.matchPrefix.replace(/\/$/, "")
      if (
        normalizedPath === normalizedPrefix ||
        normalizedPath.startsWith(normalizedPrefix + "/")
      ) {
        return { page, score: 1, len: normalizedPrefix.length }
      }
    }

    const segments = normalizedHref.split("/").filter(Boolean)
    if (
      segments.length >= 3 &&
      normalizedPath.startsWith(normalizedHref + "/")
    ) {
      return { page, score: 1, len: normalizedHref.length }
    }

    return { page, score: 0, len: 0 }
  })

  const best = scored.reduce(
    (a, b) =>
      b.score > a.score || (b.score === a.score && b.len > a.len) ? b : a,
    { page: null as PageNavItem | null, score: 0, len: 0 }
  )

  const isPageActive = (page: PageNavItem) =>
    best.page !== null && page.href === best.page.href

  return (
    <div className={cn("border-b", className)} {...props}>
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <nav className="flex items-center gap-6">
          {defaultPage && (
            <PageLink page={defaultPage} isActive={isPageActive(defaultPage)} />
          )}
          {pages
            .filter((page) => !page.hidden)
            .map((page) => (
              <PageLink
                key={page.href}
                page={page}
                isActive={isPageActive(page)}
              />
            ))}
        </nav>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}

function PageLink({
  page,
  isActive,
}: {
  page: PageNavItem
  isActive: boolean
}) {
  if (page.hidden) {
    return null
  }

  return (
    <Link
      href={page.href}
      key={page.href}
      className={cn(
        "hover:text-primary relative px-1 pb-3 text-sm whitespace-nowrap transition-colors",
        isActive
          ? "text-primary font-semibold"
          : "text-muted-foreground font-medium"
      )}
    >
      {page.name}
      {page.badge != null && page.badge > 0 && (
        <span className="bg-destructive text-destructive-foreground ms-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold">
          {page.badge > 99 ? "99+" : page.badge}
        </span>
      )}
      {isActive && (
        <span className="bg-primary absolute start-0 end-0 bottom-0 h-0.5" />
      )}
    </Link>
  )
}
