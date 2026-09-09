// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

interface Row {
  label: string
  value: string
}

interface Props {
  heading: string
  rows: Row[]
}

/**
 * The reference's Information list: label on one side, value on the other,
 * a hairline between each pair.
 *
 * This replaces the icon-tile grid that stood here. The tiles gave five facts
 * five boxes, five icons and five borders to say what a list says with one
 * rule per row — and the icons were decoration, since "ISBN" and "Publisher"
 * are already words. A list also lets a long publisher name wrap instead of
 * overflowing a fixed tile.
 *
 * `justify-between` rather than a grid: the label side is short in both
 * languages, and letting each row size itself keeps a two-word Arabic label
 * from setting the column width for every row under it.
 */
export function BookInfoList({ heading, rows }: Props) {
  if (rows.length === 0) return null

  return (
    <section className="space-y-1">
      <h2 className="mb-2 text-xl font-bold">{heading}</h2>
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-6 border-b py-3 last:border-b-0"
          >
            <dt className="text-muted-foreground shrink-0 text-sm">
              {row.label}
            </dt>
            <dd className="text-end text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
