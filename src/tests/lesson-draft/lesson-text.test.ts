// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  buildLessonText,
  flattenBlocks,
  getLessonText,
  lessonPageRange,
} from "@/components/lesson-draft/lesson-text"
import { loadTextbookTwin } from "@/components/school-dashboard/listings/subjects/textbook/load"
import type { Block, TwinPage } from "@/components/school-dashboard/listings/subjects/textbook/parse"
import type { TocChapter } from "@/components/school-dashboard/listings/subjects/textbook/spine"

vi.mock("@/lib/db", () => ({ db: { lesson: { findFirst: vi.fn() } } }))
vi.mock("@/components/school-dashboard/live/queries", () => ({
  lessonVisibilityFilter: (schoolId: string) => ({
    status: "PUBLISHED",
    NOT: { overrides: { some: { schoolId, isHidden: true } } },
  }),
}))
vi.mock("@/components/school-dashboard/listings/subjects/textbook/load", () => ({
  loadTextbookTwin: vi.fn(),
}))

const page = (number: number | null, text: string, empty = false): TwinPage => ({
  number,
  empty,
  folio: null,
  blocks: text ? [{ kind: "paragraph", text }] : [],
})

const toc: TocChapter[] = [
  {
    id: "c1",
    name: "الوحدة الأولى",
    page: 3,
    lessons: [
      { id: "l1", name: "الدرس الأول", page: 3 },
      { id: "l2", name: "الدرس الثاني", page: 6 },
      { id: "l3", name: "الدرس الثالث", page: null },
    ],
  },
  {
    id: "c2",
    name: "الوحدة الثانية",
    page: 10,
    lessons: [{ id: "l4", name: "الدرس الرابع", page: 10 }],
  },
]

describe("flattenBlocks", () => {
  it("flattens headings, paragraphs, lists and table rows; skips images", () => {
    const blocks: Block[] = [
      { kind: "heading", level: 2, text: "عنوان" },
      { kind: "paragraph", text: "فقرة" },
      { kind: "list", ordered: false, items: ["أ", "ب"] },
      { kind: "list", ordered: true, items: ["ج"] },
      { kind: "table", rows: [["س", "ص"], ["١", "٢"]] },
      { kind: "image", alt: "شكل", src: "pages/3.webp" },
      { kind: "rule" },
    ]
    expect(flattenBlocks(blocks)).toBe(
      ["عنوان", "فقرة", "- أ", "- ب", "1. ج", "س | ص", "١ | ٢"].join("\n")
    )
  })
})

describe("lessonPageRange", () => {
  it("runs from the lesson's page up to before the next lesson's", () => {
    expect(lessonPageRange(toc, "l1", 20)).toEqual({ from: 3, to: 5 })
  })

  it("a lesson followed only by page-less lessons runs to the next chapter", () => {
    expect(lessonPageRange(toc, "l2", 20)).toEqual({ from: 6, to: 9 })
  })

  it("a lesson with a null page gets its chapter's range", () => {
    expect(lessonPageRange(toc, "l3", 20)).toEqual({ from: 3, to: 9 })
  })

  it("the last lesson of the book ends on the last page", () => {
    expect(lessonPageRange(toc, "l4", 14)).toEqual({ from: 10, to: 14 })
  })

  it("is null when neither the lesson nor its chapter has a page", () => {
    const bare: TocChapter[] = [
      { id: "c", name: "x", page: null, lessons: [{ id: "l", name: "y", page: null }] },
    ]
    expect(lessonPageRange(bare, "l", 9)).toBeNull()
    expect(lessonPageRange(toc, "missing", 9)).toBeNull()
  })

  it("a lesson sharing its page with the next keeps that one page", () => {
    const shared: TocChapter[] = [
      {
        id: "c",
        name: "x",
        page: 2,
        lessons: [
          { id: "a", name: "a", page: 2 },
          { id: "b", name: "b", page: 2 },
        ],
      },
    ]
    expect(lessonPageRange(shared, "a", 9)).toEqual({ from: 2, to: 2 })
  })
})

describe("buildLessonText", () => {
  const pages = [page(1, "أ".repeat(10)), page(2, "ب".repeat(10)), page(3, "ج".repeat(10))]

  it("takes only the pages in range, skipping empty ones", () => {
    const withEmpty = [...pages, page(4, "", true)]
    const r = buildLessonText(withEmpty, { from: 2, to: 4 })
    expect(r.text).toBe(`${"ب".repeat(10)}\n\n${"ج".repeat(10)}`)
    expect(r.truncated).toBe(false)
  })

  it("truncates at a page boundary, never mid-page", () => {
    const r = buildLessonText(pages, { from: 1, to: 3 }, 25)
    expect(r.text).toBe(`${"أ".repeat(10)}\n\n${"ب".repeat(10)}`)
    expect(r.truncated).toBe(true)
  })

  it("cuts a first page that alone exceeds the cap", () => {
    const r = buildLessonText([page(1, "س".repeat(100))], { from: 1, to: 1 }, 40)
    expect(r.text).toHaveLength(40)
    expect(r.truncated).toBe(true)
  })
})

describe("getLessonText", () => {
  const lessonRow = {
    id: "l1",
    name: "الدرس الأول",
    chapter: {
      name: "الوحدة الأولى",
      subject: {
        name: "اللغة العربية",
        slug: "arabic",
        status: "PUBLISHED",
        pdf: "catalog/x/textbook.pdf",
        cover: null,
        description: null,
        grades: [7],
        levels: [],
        chapters: [{ id: "c1", name: "الوحدة الأولى", lessons: [{ id: "l1", name: "الدرس الأول" }] }],
      },
    },
  }
  const twin = (pages: TwinPage[]) => ({
    status: "ok" as const,
    pdfUrl: "",
    assetBaseUrl: "",
    pagesBaseUrl: "",
    parsed: { meta: { lang: "ar" } },
    pages,
    offset: 0,
    toc: [
      { id: "c1", name: "الوحدة الأولى", page: 1, lessons: [{ id: "l1", name: "الدرس الأول", page: 1 }] },
    ],
    coverUrl: null,
  })

  beforeEach(() => vi.clearAllMocks())

  it("checks the lesson is visible to THIS school", async () => {
    vi.mocked(db.lesson.findFirst).mockResolvedValue(null)
    expect(await getLessonText("school-1", "l1")).toEqual({ status: "not_found" })
    const where = vi.mocked(db.lesson.findFirst).mock.calls[0][0]!.where
    expect(where).toMatchObject({
      id: "l1",
      status: "PUBLISHED",
      NOT: { overrides: { some: { schoolId: "school-1", isHidden: true } } },
    })
  })

  it("returns the lesson's text", async () => {
    vi.mocked(db.lesson.findFirst).mockResolvedValue(lessonRow as never)
    vi.mocked(loadTextbookTwin).mockResolvedValue(
      twin([page(1, "نص الدرس ".repeat(30))]) as never
    )
    const r = await getLessonText("school-1", "l1")
    expect(r.status).toBe("ok")
    if (r.status === "ok") {
      expect(r.lessonName).toBe("الدرس الأول")
      expect(r.chapterName).toBe("الوحدة الأولى")
      expect(r.lang).toBe("ar")
      expect(r.truncated).toBe(false)
    }
  })

  it("no_text when the twin is unavailable or the pages are empty", async () => {
    vi.mocked(db.lesson.findFirst).mockResolvedValue(lessonRow as never)
    vi.mocked(loadTextbookTwin).mockResolvedValue({ status: "unavailable", pdfUrl: "" })
    expect((await getLessonText("s", "l1")).status).toBe("no_text")
    vi.mocked(loadTextbookTwin).mockResolvedValue(twin([page(1, "قصير")]) as never)
    expect((await getLessonText("s", "l1")).status).toBe("no_text")
  })

  it("no_page_map when pages carry no numbers", async () => {
    vi.mocked(db.lesson.findFirst).mockResolvedValue(lessonRow as never)
    vi.mocked(loadTextbookTwin).mockResolvedValue(
      twin([page(null, "نص ".repeat(60))]) as never
    )
    expect((await getLessonText("s", "l1")).status).toBe("no_page_map")
  })
})
