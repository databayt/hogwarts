// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { FileText } from "lucide-react"

import { getCloudFrontUrl } from "@/lib/cloudfront-url"
import { Button } from "@/components/ui/button"

import { TextbookArticle } from "./article"
import { anchorToc, parseTwin } from "./parse"
import { TextbookReader, type ReaderLabels } from "./reader"

import "./reader.css"

/**
 * Textbook reader — the native-text "reader mode" of a catalog subject's
 * textbook. Reads the Markdown twin that sits beside the PDF on the CDN
 * (`…/textbook.md`, same key family as `Subject.pdf`), so it works for every
 * curriculum that has one: the twin's own front matter decides language,
 * direction and the extraction notice; page images (`…/pages/<N>.webp`) are
 * optional and loaded only on request.
 */
const RTL_LANGS = new Set(["ar", "fa", "ur", "he", "ps", "ku"])

function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  )
}

export interface TextbookSubject {
  name: string
  slug: string
  /** S3 key of the PDF (`catalog/textbooks/<slug>/textbook.pdf`). */
  pdfKey: string
  chapters: {
    id: string
    name: string
    lessons: { id: string; name: string }[]
  }[]
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
  const base = subject.pdfKey.replace(/\/[^/]+$/, "")
  const pdfUrl = getCloudFrontUrl(subject.pdfKey)
  const mdUrl = getCloudFrontUrl(`${base}/textbook.md`)
  const pagesBaseUrl = getCloudFrontUrl(`${base}/pages`)
  const subjectHref = `/${lang}/subjects/${subject.slug}`

  let markdown: string | null = null
  try {
    const res = await fetch(mdUrl, { next: { revalidate: 3600 } })
    if (res.ok) markdown = await res.text()
  } catch {
    markdown = null
  }

  if (markdown === null || markdown.trim().length === 0) {
    return (
      <section className="mx-auto max-w-prose space-y-4 py-10 text-center">
        <p className="text-muted-foreground">
          {markdown === null ? labels.unavailable : labels.noText}
        </p>
        <Button asChild variant="outline">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="size-4" />
            {labels.openPdf}
          </a>
        </Button>
      </section>
    )
  }

  const parsed = parseTwin(markdown)
  const toc = anchorToc(parsed.pages, subject.chapters)
  const bookLang = parsed.meta.lang || "ar"
  const dir: "rtl" | "ltr" = RTL_LANGS.has(bookLang) ? "rtl" : "ltr"
  const hasText = parsed.pages.some((p) => p.blocks.length > 0)
  const notice =
    parsed.meta.quality && parsed.meta.coverage != null
      ? fill(labels.notice, {
          quality: parsed.meta.quality,
          coverage: parsed.meta.coverage,
        })
      : null

  if (!hasText) {
    return (
      <section className="mx-auto max-w-prose space-y-4 py-10 text-center">
        <p className="text-muted-foreground">{labels.noText}</p>
        <Button asChild variant="outline">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="size-4" />
            {labels.openPdf}
          </a>
        </Button>
      </section>
    )
  }

  return (
    <TextbookReader
      labels={labels}
      toc={toc}
      pdfUrl={pdfUrl}
      subjectHref={subjectHref}
      hasPageMarkers={parsed.hasPageMarkers}
      sourcePages={parsed.meta.sourcePages}
      notice={notice}
    >
      <TextbookArticle
        pages={parsed.pages}
        dir={dir}
        lang={bookLang}
        pagesBaseUrl={pagesBaseUrl}
        labels={{ page: labels.page, noTextOnPage: labels.noTextOnPage }}
      />
    </TextbookReader>
  )
}
