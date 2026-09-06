// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Block, TwinPage } from "./parse"

/**
 * Server-rendered body of the reader: one `<section>` per PDF page, blocks as
 * semantic HTML. Rendered once on the server and handed to the client shell
 * as children, so the book text never travels as a prop.
 *
 * Page images are emitted with `data-src` only; the client copies it to `src`
 * when the reader turns page images on, so nothing is fetched until asked.
 */
export interface ArticleLabels {
  page: string
  noTextOnPage: string
}

export function TextbookArticle({
  pages,
  dir,
  lang,
  pagesBaseUrl,
  labels,
}: {
  pages: TwinPage[]
  dir: "rtl" | "ltr"
  lang: string
  pagesBaseUrl: string
  labels: ArticleLabels
}) {
  return (
    <article
      id="textbook-article"
      className="reader-article mx-auto w-full max-w-[72ch]"
      dir={dir}
      lang={lang}
    >
      {pages.map((page, idx) => (
        <section
          key={page.number ?? `s-${idx}`}
          id={page.number != null ? `p-${page.number}` : undefined}
          data-page={page.number ?? undefined}
          className="reader-page"
        >
          {page.number != null && (
            <>
              <p className="reader-page-number">
                {labels.page} {page.number}
              </p>
              <figure className="reader-page-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  data-src={`${pagesBaseUrl}/${page.number}.webp`}
                  alt={`${labels.page} ${page.number}`}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </>
          )}
          {page.empty && (
            <p className="text-muted-foreground">{labels.noTextOnPage}</p>
          )}
          {page.blocks.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
        </section>
      ))}
    </article>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "heading": {
      // h1 is the page title; book headings start at h2.
      const Tag = `h${Math.min(block.level + 1, 5)}` as
        | "h2"
        | "h3"
        | "h4"
        | "h5"
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
        <div className="reader-table">
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
