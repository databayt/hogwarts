"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Neighbour {
  name: string
  url: string
}

interface DocsMobileNavProps {
  neighbours: {
    previous?: Neighbour
    next?: Neighbour
  }
  lang: string
}

export function DocsMobileNav({ neighbours, lang }: DocsMobileNavProps) {
  const isRTL = lang === 'ar'

  if (!neighbours.previous && !neighbours.next) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t bg-background p-4 md:hidden">
      {neighbours.previous ? (
        <Link
          href={`/${lang}${neighbours.previous.url}`}
          className={cn(
            "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground",
            isRTL && "flex-row-reverse"
          )}
        >
          {isRTL ? (
            <>
              <span className="truncate max-w-[150px]">{neighbours.previous.name}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[150px]">{neighbours.previous.name}</span>
            </>
          )}
        </Link>
      ) : (
        <div />
      )}

      {neighbours.next && (
        <Link
          href={`/${lang}${neighbours.next.url}`}
          className={cn(
            "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground",
            isRTL && "flex-row-reverse"
          )}
        >
          {isRTL ? (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[150px]">{neighbours.next.name}</span>
            </>
          ) : (
            <>
              <span className="truncate max-w-[150px]">{neighbours.next.name}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </>
          )}
        </Link>
      )}
    </div>
  )
}