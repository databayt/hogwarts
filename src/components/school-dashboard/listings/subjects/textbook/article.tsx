// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { formatNumber } from "./format"
import { Ornament } from "./ornament"
import type { Block, TwinPage } from "./parse"

/**
 * One flow of the book, server-rendered: a `<section id="p-N">` per PDF
 * page with the page's blocks as semantic HTML. The client lays the flow out
 * in screen-sized columns; the page sections are what it reads back to know
 * which printed page a screen shows. Chapter and lesson openers are the
 * designed headings (kicker, title, ornament) placed at the page they start.
 */
export interface Opener {
  kicker: string | null
  title: string
  level: "chapter" | "lesson"
}

export function TextbookArticle({
  pages,
  openers,
  dir,
  lang,
  offset,
}: {
  pages: TwinPage[]
  openers: Record<number, Opener>
  dir: "rtl" | "ltr"
  lang: string
  /** PDF index − printed number; null hides the printed folios. */
  offset: number | null
}) {
  return (
    <div className="book-flow" dir={dir} lang={lang}>
      {pages.map((page, idx) => {
        const n = page.number
        const opener = n != null ? openers[n] : undefined
        const printed =
          n != null && offset != null && n - offset > 0 ? n - offset : null
        return (
          <section
            key={n ?? `s-${idx}`}
            id={n != null ? `p-${n}` : undefined}
            data-page={n ?? undefined}
            className="book-page"
          >
            {opener && (
              <header className="book-opener" data-level={opener.level}>
                {opener.kicker && (
                  <p className="book-kicker">{opener.kicker}</p>
                )}
                {opener.level === "chapter" ? (
                  <h2>{opener.title}</h2>
                ) : (
                  <h3>{opener.title}</h3>
                )}
                <Ornament />
              </header>
            )}
            {printed != null && (
              <span className="book-folio" aria-hidden="true">
                {formatNumber(printed, lang)}
              </span>
            )}
            {page.blocks.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </section>
        )
      })}
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "heading": {
      // h2 is reserved for the chapter opener; book headings start at h3.
      const Tag = `h${Math.min(block.level + 2, 5)}` as "h3" | "h4" | "h5"
      return <Tag>{block.text}</Tag>
    }
    case "paragraph":
      return <p>{block.text}</p>
    case "list":
      return block.ordered ? (
        <ol>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case "table": {
      const [head, ...body] = block.rows
      return (
        <div className="book-table">
          <table>
            <thead>
              <tr>
                {head.map((cell, i) => (
                  <th key={i}>{cell}</th>
                ))}
              </tr>
            </thead>
            {body.length > 0 && (
              <tbody>
                {body.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )
    }
    case "rule":
      return <hr />
  }
}
