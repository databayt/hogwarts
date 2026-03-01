"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { usePathname, useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

interface SectionLink {
  key: string
  title: string
  description: string
}

interface ConfigSidebarProps {
  lang: string
  sectionLinks: SectionLink[]
}

export function ConfigSidebar({ lang, sectionLinks }: ConfigSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="lg:col-span-1 lg:h-full lg:overflow-hidden">
      <div className="max-w-[240px] space-y-2 pe-8 lg:h-full lg:overflow-y-auto">
        {sectionLinks.map((link) => {
          const isActive = pathname.includes(`/configuration/${link.key}`)

          return (
            <Card
              key={link.key}
              onClick={() =>
                router.push(`/${lang}/school/configuration/${link.key}`)
              }
              className={cn(
                "hover:border-foreground cursor-pointer transition-colors",
                isActive && "border-foreground bg-muted"
              )}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-sm capitalize">
                  {link.title}
                </CardTitle>
                {link.description && (
                  <p className="text-muted-foreground text-xs">
                    {link.description}
                  </p>
                )}
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
