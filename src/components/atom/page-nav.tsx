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

  // Helper to check if a page is active
  const isPageActive = (page: PageNavItem) => {
    // Remove trailing slash for comparison
    const normalizedPath = pathname.replace(/\/$/, "")
    const normalizedHref = page.href.replace(/\/$/, "")

    // Exact match
    if (normalizedPath === normalizedHref) return true

    // If exact is set, only use exact match (no sub-path matching)
    if (page.exact) return false

    // Sub-path match only for deep links (e.g. /school/configuration matches /school/configuration/identity)
    // Skip for shallow hrefs like /school (would falsely match /school/configuration)
    const segments = normalizedHref.split("/").filter(Boolean)
    if (
      segments.length >= 3 &&
      normalizedPath.startsWith(normalizedHref + "/")
    ) {
      return true
    }

    return false
  }

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
      {isActive && (
        <span className="bg-primary absolute start-0 end-0 bottom-0 h-0.5" />
      )}
    </Link>
  )
}
