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

  return (
    <div className={cn("border-b", className)} {...props}>
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <nav className="flex items-center gap-6 rtl:flex-row-reverse">
          {defaultPage && (
            <PageLink
              page={defaultPage}
              isActive={pathname === defaultPage.href}
            />
          )}
          {pages.map((page) => (
            <PageLink
              key={page.href}
              page={page}
              isActive={pathname?.startsWith(page.href) ?? false}
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
        "relative px-1 pb-3 text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      {page.name}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
      )}
    </Link>
  )
}
