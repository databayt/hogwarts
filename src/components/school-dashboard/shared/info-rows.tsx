// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface InfoRow {
  key?: string
  label: string
  value: ReactNode
}

interface InfoRowsProps {
  heading?: string
  rows: InfoRow[]
  className?: string
}

/**
 * Facts as the book page's Information list: label on the start side, value on
 * the end, one hairline between each pair (`library/book-detail/info-list.tsx`).
 *
 * `justify-between` rather than a two-column grid, for the reason the book page
 * gives: a long Arabic label would otherwise set the label column's width for
 * every row under it. The value may wrap; the label never does.
 */
export function InfoRows({ heading, rows, className }: InfoRowsProps) {
  const visible = rows.filter(
    (row) => row.value !== null && row.value !== undefined && row.value !== ""
  )
  if (visible.length === 0) return null

  return (
    <section className={className}>
      {heading ? (
        <h2 className="mb-1 text-lg leading-7 font-semibold">{heading}</h2>
      ) : null}
      <dl>
        {visible.map((row) => (
          <div
            key={row.key ?? row.label}
            className={cn(
              "flex items-baseline justify-between gap-6 border-b py-3 last:border-b-0"
            )}
          >
            <dt className="text-muted-foreground shrink-0 text-sm">
              {row.label}
            </dt>
            <dd className="min-w-0 text-end text-sm font-medium break-words">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
