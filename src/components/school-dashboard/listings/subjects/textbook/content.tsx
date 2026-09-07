// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { FileText } from "lucide-react"

import { getCloudFrontUrl } from "@/lib/cloudfront-url"
import { Button } from "@/components/ui/button"
import { isRTL, type Locale } from "@/components/internationalization/config"

import { TextbookArticle, type Opener } from "./article"
import { BookReader } from "./book"
import { fill, formatNumber } from "./format"
import { anchorToc, detectPageOffset, parseTwin } from "./parse"
import { groupSections, resolveToc, type DbChapter } from "./spine"
import { fetchStructure } from "./structure"
import type { BookMeta, CoverInfo, ReaderLabels, SectionMeta } from "./types"

import "./reader.css"

/**
 * Textbook reader — the subject's textbook as a book, one screen per page.
 * Reads the Markdown twin that sits beside the PDF on the CDN
 * (`…/textbook.md`, same key family as `Subject.pdf`) and, when published,
 * the authoring `structure.json` beside it for exact chapter pages. The
 * twin's front matter decides language, direction and the extraction
 * notice; page images (`…/pages/<N>.webp`) power the original-pages view.
 */
const RTL_LANGS = new Set(["ar", "fa", "ur", "he", "ps", "ku"])

export interface TextbookSubject {
  name: string
  slug: string
  /** S3 key of the PDF (`catalog/textbooks/<slug>/textbook.pdf`). */
  pdfKey: string
  coverKey: string | null
  description: string | null
  grade: number | null
  chapters: DbChapter[]
}

async function fetchTwin(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

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
  const base = subject.pdfKey.replace(/\/[^/]+$/, "")
  const pdfUrl = getCloudFrontUrl(subject.pdfKey)
  const mdUrl = getCloudFrontUrl(`${base}/textbook.md`)
  const pagesBaseUrl = getCloudFrontUrl(`${base}/pages`)
  const structureUrl = getCloudFrontUrl(`${base}/structure.json`)
  const subjectHref = `/${lang}/subjects/${subject.slug}`

  const [markdown, structure] = await Promise.all([
    fetchTwin(mdUrl),
    fetchStructure(structureUrl),
  ])

  if (markdown === null || markdown.trim().length === 0)
    return (
      <Fallback
        message={markdown === null ? labels.unavailable : labels.noText}
        pdfUrl={pdfUrl}
        label={labels.openPdf}
      />
    )

  const parsed = parseTwin(markdown)
  if (!parsed.pages.some((p) => p.blocks.length > 0))
    return (
      <Fallback
        message={labels.noText}
        pdfUrl={pdfUrl}
        label={labels.openPdf}
      />
    )

  const offset = detectPageOffset(parsed.pages)
  const anchors = anchorToc(parsed.pages, subject.chapters)
  const toc = resolveToc(
    subject.chapters,
    structure,
    offset,
    parsed.meta.sourcePages,
    anchors
  )
  const groups = groupSections(parsed.pages, toc, parsed.hasPageMarkers)

  const bookLang = parsed.meta.lang || "ar"
  const dir: "rtl" | "ltr" = RTL_LANGS.has(bookLang) ? "rtl" : "ltr"
  const uiDir: "rtl" | "ltr" = isRTL(lang as Locale) ? "rtl" : "ltr"
  const title = parsed.meta.title || subject.name

  const sections: SectionMeta[] = groups.map((g) => {
    const ch = g.chapterIndex != null ? toc[g.chapterIndex] : null
    return {
      kind: g.kind,
      title: ch ? ch.name : g.kind === "front" ? labels.frontMatter : title,
      kicker:
        ch && g.chapterIndex != null
          ? fill(labels.unitN, { n: formatNumber(g.chapterIndex + 1, lang) })
          : null,
      pages: g.pages.flatMap((p) => (p.number != null ? [p.number] : [])),
      chapterIndex: g.chapterIndex,
    }
  })

  // Openers: the chapter heading on a chapter flow's first page, a lesson
  // heading on the first page at or after each lesson's start.
  const openers: Record<number, Opener>[] = groups.map((g, i) => {
    const out: Record<number, Opener> = {}
    const ch = g.chapterIndex != null ? toc[g.chapterIndex] : null
    const first = g.pages[0]?.number
    if (ch && first != null)
      out[first] = {
        kicker: sections[i].kicker,
        title: ch.name,
        level: "chapter",
      }
    for (const lesson of ch?.lessons ?? []) {
      const start = lesson.page
      if (start == null) continue
      const page = g.pages.find((p) => p.number != null && p.number >= start)
      if (
        !page ||
        page.number == null ||
        page.number === first ||
        out[page.number]
      )
        continue
      out[page.number] = { kicker: null, title: lesson.name, level: "lesson" }
    }
    return out
  })

  const printedPages =
    parsed.meta.sourcePages != null
      ? offset != null
        ? parsed.meta.sourcePages - offset
        : parsed.meta.sourcePages
      : null
  const lessonCount = subject.chapters.reduce((n, c) => n + c.lessons.length, 0)
  const stats: string[] = []
  if (printedPages)
    stats.push(fill(labels.pagesCount, { n: formatNumber(printedPages, lang) }))
  if (subject.chapters.length)
    stats.push(
      fill(labels.unitsCount, {
        n: formatNumber(subject.chapters.length, lang),
      })
    )
  if (lessonCount)
    stats.push(
      fill(labels.lessonsCount, { n: formatNumber(lessonCount, lang) })
    )

  const meta: BookMeta = {
    title,
    edition: parsed.meta.edition,
    lang: bookLang,
    dir,
    sourcePages: parsed.meta.sourcePages,
    offset,
    notice:
      parsed.meta.quality && parsed.meta.coverage != null
        ? fill(labels.notice, {
            quality: parsed.meta.quality,
            coverage: parsed.meta.coverage,
          })
        : null,
    hasPageImages: parsed.hasPageMarkers,
  }
  const cover: CoverInfo = {
    url: subject.coverKey ? getCloudFrontUrl(subject.coverKey) : null,
    kicker: [
      labels.textbook,
      subject.grade != null
        ? fill(labels.gradeN, { n: formatNumber(subject.grade, lang) })
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
    description: subject.description,
    stats,
  }

  return (
    <BookReader
      slug={subject.slug}
      meta={meta}
      toc={toc}
      sections={sections}
      cover={cover}
      pdfUrl={pdfUrl}
      pagesBaseUrl={pagesBaseUrl}
      subjectHref={subjectHref}
      labels={labels}
      uiLang={lang}
      uiDir={uiDir}
    >
      {groups.map((g, i) => (
        <TextbookArticle
          key={i}
          pages={g.pages}
          openers={openers[i]}
          dir={dir}
          lang={bookLang}
          offset={offset}
        />
      ))}
    </BookReader>
  )
}
