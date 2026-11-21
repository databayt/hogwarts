// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { db } from "@/lib/db"
import { lessonVisibilityFilter } from "@/components/school-dashboard/live/queries"
import type { Block, TwinPage } from "@/components/school-dashboard/listings/subjects/textbook/parse"
import {
  loadTextbookTwin,
  type TextbookSubject,
} from "@/components/school-dashboard/listings/subjects/textbook/load"
import type { TocChapter } from "@/components/school-dashboard/listings/subjects/textbook/spine"

/**
 * The textbook text of one catalog lesson, as plain text for the model.
 *
 * The catalog is global, so the lesson is checked visible to THIS school
 * (`lessonVisibilityFilter`) before anything is fetched. The text twin comes
 * from the CDN and is untrusted: the prompt fences it.
 */

/** Characters of lesson text sent to the model, cut at a page boundary. */
export const MAX_TEXT_CHARS = 36_000
/** Less than this and the page range held no real text. */
const MIN_TEXT_CHARS = 80

export type LessonText =
  | {
      status: "ok"
      lessonName: string
      chapterName: string
      text: string
      truncated: boolean
      lang: "ar" | "en"
    }
  | {
      status: "no_page_map" | "no_text"
      lessonName?: string
      chapterName?: string
    }
  | { status: "not_found" }

/** Headings, paragraphs, lists and table rows as text; images skipped. */
export function flattenBlocks(blocks: Block[]): string {
  const out: string[] = []
  for (const b of blocks) {
    if (b.kind === "heading" || b.kind === "paragraph") out.push(b.text)
    else if (b.kind === "list")
      out.push(
        ...b.items.map((item, i) => (b.ordered ? `${i + 1}. ${item}` : `- ${item}`))
      )
    else if (b.kind === "table")
      out.push(...b.rows.map((row) => row.join(" | ")))
    // rule and image carry no text
  }
  return out.join("\n")
}

/**
 * The inclusive PDF page range of a lesson: from its own page up to just
 * before the next lesson (or the next chapter, or the last page). A lesson
 * with no page of its own gets its chapter's whole range. null when even the
 * chapter has no page.
 */
export function lessonPageRange(
  toc: TocChapter[],
  lessonId: string,
  lastPage: number
): { from: number; to: number } | null {
  const ci = toc.findIndex((c) => c.lessons.some((l) => l.id === lessonId))
  if (ci === -1) return null
  const chapter = toc[ci]
  const li = chapter.lessons.findIndex((l) => l.id === lessonId)
  const lesson = chapter.lessons[li]

  const nextChapterPage =
    toc.slice(ci + 1).find((c) => c.page !== null)?.page ?? null

  if (lesson.page === null) {
    if (chapter.page === null) return null
    const to = nextChapterPage !== null ? nextChapterPage - 1 : lastPage
    return { from: chapter.page, to: Math.max(chapter.page, to) }
  }

  const from = lesson.page
  const nextLesson = chapter.lessons
    .slice(li + 1)
    .find((l) => l.page !== null && l.page >= from)
  const end =
    nextLesson?.page ?? nextChapterPage ?? lastPage + 1
  // The next lesson opens on `end`; this one ends the page before — unless
  // they share a page, which is then this lesson's only page.
  return { from, to: Math.max(from, Math.min(lastPage, end - 1)) }
}

/**
 * The pages' text joined, capped at `cap` characters at a page boundary.
 * A first page longer than the cap is cut hard.
 */
export function buildLessonText(
  pages: TwinPage[],
  range: { from: number; to: number },
  cap = MAX_TEXT_CHARS
): { text: string; truncated: boolean } {
  let text = ""
  let truncated = false
  for (const page of pages) {
    if (page.number === null || page.empty) continue
    if (page.number < range.from || page.number > range.to) continue
    const chunk = flattenBlocks(page.blocks).trim()
    if (!chunk) continue
    const next = text ? `${text}\n\n${chunk}` : chunk
    if (next.length > cap) {
      truncated = true
      if (!text) text = chunk.slice(0, cap)
      break
    }
    text = next
  }
  return { text, truncated }
}

export async function getLessonText(
  schoolId: string,
  lessonId: string
): Promise<LessonText> {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, ...lessonVisibilityFilter(schoolId) },
    select: {
      id: true,
      name: true,
      chapter: {
        select: {
          name: true,
          subject: {
            select: {
              name: true,
              slug: true,
              status: true,
              pdf: true,
              cover: true,
              description: true,
              grades: true,
              levels: true,
              chapters: {
                where: { status: "PUBLISHED" },
                orderBy: { sequenceOrder: "asc" },
                select: {
                  id: true,
                  name: true,
                  lessons: {
                    where: { status: "PUBLISHED" },
                    orderBy: { sequenceOrder: "asc" },
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  const subject = lesson?.chapter.subject
  if (!lesson || !subject || subject.status !== "PUBLISHED")
    return { status: "not_found" }

  const names = { lessonName: lesson.name, chapterName: lesson.chapter.name }
  if (!subject.pdf) return { status: "no_text", ...names }

  // The same input the textbook page builds
  const input: TextbookSubject = {
    name: subject.name,
    slug: subject.slug,
    pdfKey: subject.pdf,
    coverKey: subject.cover,
    description: subject.description,
    grade: subject.grades[0] ?? null,
    level: subject.levels[0] ?? null,
    chapters: subject.chapters,
  }
  const twin = await loadTextbookTwin(input)
  if (twin.status !== "ok") return { status: "no_text", ...names }

  const numbered = twin.pages.filter((p) => p.number !== null)
  if (numbered.length === 0) return { status: "no_page_map", ...names }
  const lastPage = Math.max(...numbered.map((p) => p.number as number))

  const range = lessonPageRange(twin.toc, lessonId, lastPage)
  if (!range) return { status: "no_page_map", ...names }

  const { text, truncated } = buildLessonText(twin.pages, range)
  if (text.replace(/\s+/g, "").length < MIN_TEXT_CHARS)
    return { status: "no_text", ...names }

  return {
    status: "ok",
    ...names,
    text,
    truncated,
    lang: twin.parsed.meta.lang === "en" ? "en" : "ar",
  }
}
