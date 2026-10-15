"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Configuration navigator — Apple-Settings-style grouped inset lists.
 * Rows are real links (keyboard, open-in-new-tab, prefetch). The list scrolls
 * on its own and brings the active row into view, so on a 20-section list
 * you always see where you are.
 */
import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SectionLink {
  key: string
  title: string
  description: string
}

export interface SectionGroup {
  key: string
  title: string
  items: SectionLink[]
}

interface ConfigSidebarProps {
  lang: string
  groups: SectionGroup[]
  notSet: string
}

export function ConfigSidebar({ lang, groups, notSet }: ConfigSidebarProps) {
  const pathname = usePathname()
  const activeRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [pathname])

  return (
    <nav
      aria-label={groups.map((g) => g.title).join(" · ")}
      className="lg:h-full lg:overflow-hidden"
    >
      <div className="space-y-6 pb-8 lg:h-full lg:w-[280px] lg:overflow-y-auto lg:pe-2">
        {groups.map((group) => (
          <section key={group.key} className="space-y-2">
            <h2 className="text-muted-foreground px-3 text-xs font-medium">
              {group.title}
            </h2>
            <ul className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
              {group.items.map((link) => {
                const isActive = pathname.includes(
                  `/configuration/${link.key}`
                )
                return (
                  <li key={link.key}>
                    <Link
                      ref={isActive ? activeRef : undefined}
                      href={`/${lang}/school/configuration/${link.key}`}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2.5 transition-colors",
                        "hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none",
                        isActive && "bg-muted"
                      )}
                    >
                      <span className="min-w-0 flex-1 text-start">
                        <span className="block truncate text-sm font-medium">
                          {link.title}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {link.description || notSet}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden
                        className={cn(
                          "text-muted-foreground/50 size-4 shrink-0 rtl:rotate-180",
                          isActive && "text-foreground"
                        )}
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}
