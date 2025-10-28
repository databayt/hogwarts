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
    <div className="relative">
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <nav className={cn("flex items-center gap-2 rtl:flex-row-reverse", className)} {...props}>
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
      className="flex h-7 items-center justify-center rounded-full px-4 text-center transition-colors hover:text-primary data-[active=true]:bg-muted data-[active=true]:text-primary"
      data-active={isActive}
    >
      <h6>{page.name}</h6>
    </Link>
  )
}
