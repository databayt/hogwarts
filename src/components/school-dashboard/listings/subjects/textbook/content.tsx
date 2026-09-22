// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { isRTL, type Locale } from "@/components/internationalization/config"

import { TextbookArticle } from "./article"
import { BookReader } from "./book"
import { loadTextbook, type TextbookSubject } from "./load"
import type { ReaderLabels } from "./types"

import "./reader.css"

export type { TextbookSubject } from "./load"

function Fallback({
  message,
  pdfUrl,
  label,
}: {
  message: string
  pdfUrl: string
  label: string
}) {
  return (
    <section className="mx-auto max-w-prose space-y-4 py-10 text-center">
      <p className="text-muted-foreground">{message}</p>
      <Button asChild variant="outline">
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
          <FileText className="size-4" />
          {label}
        </a>
      </Button>
    </section>
  )
}

export async function TextbookContent({
  subject,
  labels,
  lang,
}: {
  subject: TextbookSubject
  labels: ReaderLabels
  lang: string
}) {
  const book = await loadTextbook(subject, labels, lang)
  const subjectHref = `/${lang}/subjects/${subject.slug}`

  if (book.status !== "ok")
    return (
      <Fallback
        message={
          book.status === "unavailable" ? labels.unavailable : labels.noText
        }
        pdfUrl={book.pdfUrl}
        label={labels.openPdf}
      />
    )

  const uiDir: "rtl" | "ltr" = isRTL(lang as Locale) ? "rtl" : "ltr"

  return (
    <BookReader
      slug={subject.slug}
      meta={book.meta}
      toc={book.toc}
      sections={book.sections.map((s) => s.meta)}
      cover={book.cover}
      pdfUrl={book.pdfUrl}
      pagesBaseUrl={book.pagesBaseUrl}
      subjectHref={subjectHref}
      labels={labels}
      uiLang={lang}
      uiDir={uiDir}
    >
      {book.sections.map((s, i) => (
        <TextbookArticle
          key={i}
          pages={s.pages}
          openers={s.openers}
          dir={book.meta.dir}
          lang={book.meta.lang}
          offset={book.meta.offset}
          assetBaseUrl={book.assetBaseUrl}
        />
      ))}
    </BookReader>
  )
}
