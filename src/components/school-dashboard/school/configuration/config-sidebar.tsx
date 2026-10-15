"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Configuration navigator — one card per section, title over a live summary.
 * Cards are real links (keyboard, open-in-new-tab, prefetch), and the list
 * scrolls the active card into view so you always see where you are.
 */
import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export interface SectionLink {
  key: string
  title: string
  description: string
}

interface ConfigSidebarProps {
  lang: string
  sectionLinks: SectionLink[]
  notSet: string
}

export function ConfigSidebar({
  lang,
  sectionLinks,
  notSet,
}: ConfigSidebarProps) {
  const pathname = usePathname()
  const activeRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [pathname])

  return (
    <nav className="lg:col-span-1 lg:h-full lg:overflow-hidden">
      <div className="space-y-2 pb-8 lg:h-full lg:w-[240px] lg:overflow-y-auto lg:pe-4">
        {sectionLinks.map((link) => {
          const isActive = pathname.includes(`/configuration/${link.key}`)
          return (
            <Link
              key={link.key}
              ref={isActive ? activeRef : undefined}
              href={`/${lang}/school/configuration/${link.key}`}
              aria-current={isActive ? "page" : undefined}
              className="block rounded-xl focus-visible:outline-none"
            >
              <Card
                className={cn(
                  "hover:border-foreground transition-colors",
                  isActive && "border-foreground bg-muted"
                )}
              >
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">{link.title}</CardTitle>
                  <p className="text-muted-foreground truncate text-xs">
                    {link.description || notSet}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
