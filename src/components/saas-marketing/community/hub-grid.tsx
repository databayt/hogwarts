// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { RESOURCE_TYPES } from "./config"
import type { CommunityCounts } from "./types"
import { buildFilterQuery } from "./util"

interface Props {
  dictionary: Dictionary
  lang: string
  counts: CommunityCounts
  /** Filters propagated into each drill-down link so state survives a click */
  filters: { curriculum?: string; grade?: number | null }
}

/**
 * Six-card grid shown on the /community hub. Each card links to a drill-down
 * page with the current curriculum/grade filters preserved in the URL.
 */
export function CommunityHubGrid({ dictionary, lang, counts, filters }: Props) {
  const types = dictionary?.community?.types
  const query = buildFilterQuery(filters)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {RESOURCE_TYPES.map((meta) => {
        const Icon = meta.icon
        const count = counts[meta.id]
        const copy = types?.[meta.dictKey]
        return (
          <Link
            key={meta.id}
            href={`/${lang}${meta.href}${query}`}
            className="group block focus-visible:outline-none"
          >
            <Card
              className={cn(
                "h-full p-6 transition-colors",
                "group-hover:border-foreground/20 group-focus-visible:ring-ring group-focus-visible:ring-2"
              )}
            >
              <CardContent className="flex h-full flex-col gap-3 p-0">
                <div className="bg-muted flex size-10 items-center justify-center rounded-md">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {copy?.label ?? meta.id}
                  </h3>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {count.toLocaleString()}
                  </span>
                </div>
                {copy?.description ? (
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {copy.description}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
