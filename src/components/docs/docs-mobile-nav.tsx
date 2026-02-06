"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
  const isRTL = lang === "ar"

  if (!neighbours.previous && !neighbours.next) {
    return null
  }

  return (
    <div className="bg-background fixed start-0 end-0 bottom-0 z-50 flex items-center justify-between border-t p-4 md:hidden">
      {neighbours.previous ? (
        <Link
          href={`/${lang}${neighbours.previous.url}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium rtl:flex-row-reverse"
        >
          {isRTL ? (
            <>
              <span className="max-w-[150px] truncate">
                {neighbours.previous.name}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="max-w-[150px] truncate">
                {neighbours.previous.name}
              </span>
            </>
          )}
        </Link>
      ) : (
        <div />
      )}

      {neighbours.next && (
        <Link
          href={`/${lang}${neighbours.next.url}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium rtl:flex-row-reverse"
        >
          {isRTL ? (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="max-w-[150px] truncate">
                {neighbours.next.name}
              </span>
            </>
          ) : (
            <>
              <span className="max-w-[150px] truncate">
                {neighbours.next.name}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </>
          )}
        </Link>
      )}
    </div>
  )
}
