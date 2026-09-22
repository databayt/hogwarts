// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { loadTextbook } from "@/components/school-dashboard/listings/subjects/textbook/load"
import type { Block } from "@/components/school-dashboard/listings/subjects/textbook/parse"
import type { ReaderLabels } from "@/components/school-dashboard/listings/subjects/textbook/types"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * A subject's textbook for the phone's reader — `/subjects/[slug]/textbook`,
 * as data.
 *
 * The same query as the web page and the same `loadTextbook`, so the phone
 * gets exactly the book the browser renders: the pages of blocks, the
 * contents resolved to pages, the flows (front matter, then a chapter each),
 * the chapter and lesson openers, the cover lines and the page offset. The
 * phone only paginates it — for its own screen, font and size, as the web's
 * column engine does for the browser's.
 *
 * GET /api/mobile/textbooks/:slug?lang=ar|en
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { slug } = await params
    const lang = (new URL(request.url).searchParams.get("lang") === "en"
      ? "en"
      : "ar") as Locale

    const subject = await db.subject.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: {
        name: true,
        slug: true,
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
    })
    if (!subject || !subject.pdf) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const dictionary = await getDictionary(lang)
    const labels = (dictionary.school?.subjects?.catalog?.reader ??
      {}) as ReaderLabels

    const book = await loadTextbook(
      {
        name: subject.name,
        slug: subject.slug,
        pdfKey: subject.pdf,
        coverKey: subject.cover,
        description: subject.description,
        grade: subject.grades[0] ?? null,
        level: subject.levels[0] ?? null,
        chapters: subject.chapters,
      },
      labels,
      lang
    )

    if (book.status !== "ok") {
      return NextResponse.json({ status: book.status, pdf_url: book.pdfUrl })
    }

    return NextResponse.json({
      status: "ok",
      slug: subject.slug,
      pdf_url: book.pdfUrl,
      asset_base_url: book.assetBaseUrl,
      meta: {
        title: book.meta.title,
        edition: book.meta.edition,
        lang: book.meta.lang,
        dir: book.meta.dir,
        source_pages: book.meta.sourcePages,
        offset: book.meta.offset,
      },
      cover: {
        url: book.cover.url,
        stage: book.cover.stage,
        grade_line: book.cover.gradeLine,
      },
      toc: book.toc.map((ch) => ({
        id: ch.id,
        name: ch.name,
        page: ch.page,
        lessons: ch.lessons.map((l) => ({ id: l.id, name: l.name, page: l.page })),
      })),
      sections: book.sections.map((s) => ({
        kind: s.meta.kind,
        title: s.meta.title,
        kicker: s.meta.kicker,
        chapter_index: s.meta.chapterIndex,
        pages: s.pages.map((p) => ({
          number: p.number,
          empty: p.empty,
          opener: p.number != null ? (s.openers[p.number] ?? null) : null,
          blocks: p.blocks.map(toBlockDto),
        })),
      })),
    })
  } catch (error) {
    console.error("[mobile/textbooks] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function toBlockDto(b: Block) {
  switch (b.kind) {
    case "heading":
      return { kind: "heading", level: b.level, text: b.text }
    case "paragraph":
      return { kind: "paragraph", text: b.text }
    case "list":
      return { kind: "list", ordered: b.ordered, items: b.items }
    case "table":
      return { kind: "table", rows: b.rows }
    case "rule":
      return { kind: "rule" }
    case "image":
      return { kind: "image", alt: b.alt, src: b.src }
  }
}
