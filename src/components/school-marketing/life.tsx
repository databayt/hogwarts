// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface LifeProps {
  dictionary?: Dictionary
}

/**
 * Column-span rhythm for the lg:12-col row -- 7+5, then 4+4+4, then a
 * full-width closer. Three rows, no gaps, no overflow: the irregularity is
 * pure CSS (topmate.io's bento trick), no masonry JS involved. Each span is
 * paired with a band token so the grid also carries color rhythm; empty
 * string falls back to the plain card surface.
 */
const LAYOUT = [
  { span: "lg:col-span-7", band: "" },
  { span: "lg:col-span-5", band: "band-warm" },
  { span: "lg:col-span-4", band: "" },
  { span: "lg:col-span-4", band: "band-cool" },
  { span: "lg:col-span-4", band: "" },
  { span: "lg:col-span-12", band: "band-ink" },
] as const

/**
 * A week at the school, told through six irregular cards instead of a
 * uniform 3x2 grid -- a normal Tuesday reads differently from the closing,
 * full-width note, and the column-span math is what makes that possible.
 */
export function Life({ dictionary }: LifeProps) {
  const t = dictionary?.marketing?.site?.life
  const titleLines = (t?.title ?? "").split("\n").filter(Boolean)
  const items = t?.items ?? []

  return (
    <section className="section-y">
      <div className="mb-10 max-w-2xl md:mb-14">
        {t?.eyebrow && <p className="eyebrow mb-3">{t.eyebrow}</p>}
        <h2 className="display-2">
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h2>
        {t?.description && (
          <p className="display-intro mt-4">{t.description}</p>
        )}
      </div>

      <div className="grid grid-cols-6 gap-3 md:gap-4 lg:grid-cols-12">
        {items.map((item, i) => {
          const { span, band } = LAYOUT[i % LAYOUT.length]
          const muted = band ? "band-muted" : "text-muted-foreground"

          return (
            <div
              key={item.tag}
              className={cn(
                "col-span-6 rounded-2xl border p-6 md:p-8",
                band || "bg-card",
                span
              )}
            >
              <Badge variant="secondary" className="tracking-wide uppercase">
                {item.tag}
              </Badge>
              <h3 className="display-3 mt-4">{item.title}</h3>
              <p className={cn("mt-3", muted)}>{item.body}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
