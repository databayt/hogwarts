"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export interface PageNavItem {
  name: string
  href: string
  hidden?: boolean
}

interface PageNavProps extends React.HTMLAttributes<HTMLDivElement> {
  pages: PageNavItem[]
  defaultPage?: PageNavItem
}

export function PageNav({ pages, defaultPage, className, ...props }: PageNavProps) {
  const pathname = usePathname()

  // Helper to check if a page is active
  const isPageActive = (pageHref: string) => {
    // Remove trailing slash for comparison
    const normalizedPath = pathname.replace(/\/$/, '')
    const normalizedHref = pageHref.replace(/\/$/, '')

    // For attendance overview, check if we're at the base attendance path
    if (normalizedHref.endsWith('/attendance') && normalizedPath.endsWith('/attendance')) {
      return true
    }

    // For other pages, check exact match
    return normalizedPath === normalizedHref
  }

  return (
    <div className={cn("border-b border-border/40", className)} {...props}>
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <nav className="flex items-center gap-4 lg:gap-6 rtl:flex-row-reverse -mb-px">
          {defaultPage && (
            <PageLink
              page={defaultPage}
              isActive={isPageActive(defaultPage.href)}
            />
          )}
          {pages.map((page) => (
            <PageLink
              key={page.href}
              page={page}
              isActive={isPageActive(page.href)}
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
        "relative px-2 py-4 text-sm font-medium transition-colors whitespace-nowrap",
        isActive
          ? "text-foreground border-b-2 border-primary"
          : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-border"
      )}
    >
      {page.name}
    </Link>
  )
}
