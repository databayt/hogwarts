// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { legalDocs, type LegalKey, type LegalLang } from "./content"

interface LegalContentProps {
  doc: LegalKey
  lang: LegalLang
}

/** Plain, readable legal page: one column, semantic headings, RTL-aware. */
export default function LegalContent({ doc, lang }: LegalContentProps) {
  const d = legalDocs[doc][lang]
  return (
    <article
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16"
    >
      <h1 className="text-foreground">{d.title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{d.updated}</p>
      <p className="text-muted-foreground mt-6">{d.intro}</p>
      {d.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="text-foreground">{s.heading}</h2>
          {s.paragraphs?.map((p) => (
            <p key={p} className="text-muted-foreground mt-3">
              {p}
            </p>
          ))}
          {s.items && (
            <ul className="text-muted-foreground mt-3 list-disc space-y-2 ps-6">
              {s.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  )
}
