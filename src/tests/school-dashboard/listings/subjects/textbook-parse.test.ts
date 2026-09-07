import { describe, expect, it } from "vitest"

import {
  anchorToc,
  cleanInline,
  detectPageOffset,
  normalizeForSearch,
  normalizeWithMap,
  parseFrontMatter,
  parseTwin,
} from "@/components/school-dashboard/listings/subjects/textbook/parse"
import {
  groupSections,
  inferPageOffset,
  isCoverPage,
  isNoisePage,
  normalizeStructure,
  resolvePageOffset,
  resolveToc,
} from "@/components/school-dashboard/listings/subjects/textbook/spine"

const TWIN = `---
title: "الفيزياء"
titleEn: "Physics"
lang: ar
sourcePages: 3
quality: A
coverage: 52  # extracted text per page vs ~1200 chars of prose
extraction: ocr
notes:
  - "OCR text is machine-read"
---

# الفيزياء
<!-- page 1 -->

المجال التثاقلي

يعرف المجال التثاقلي بأنه المنطقة المحيطة بالجسم.

- أولاً
- ثانياً

<!-- page 2: no text recognised -->
<!-- page 3 -->

## الحركة الدائرية

| الكمية | الوحدة |
|---|---|
| السرعة | م/ث |

1. خطوة أولى
2. خطوة ثانية
`

describe("parseFrontMatter", () => {
  it("reads scalar fields, strips quotes and trailing comments, skips lists", () => {
    const { fields, body } = parseFrontMatter(TWIN)
    expect(fields.title).toBe("الفيزياء")
    expect(fields.lang).toBe("ar")
    expect(fields.coverage).toBe("52")
    expect(fields.notes).toBe("")
    expect(body.startsWith("\n# الفيزياء")).toBe(true)
  })

  it("returns the whole text as body when there is no front matter", () => {
    const { fields, body } = parseFrontMatter("# hi\n\ntext")
    expect(fields).toEqual({})
    expect(body).toBe("# hi\n\ntext")
  })
})

describe("parseTwin", () => {
  it("splits on both marker forms and keeps page numbers", () => {
    const parsed = parseTwin(TWIN)
    expect(parsed.hasPageMarkers).toBe(true)
    expect(parsed.meta).toMatchObject({
      title: "الفيزياء",
      lang: "ar",
      sourcePages: 3,
      quality: "A",
      coverage: 52,
      extraction: "ocr",
    })
    expect(parsed.pages.map((p) => p.number)).toEqual([1, 2, 3])
    expect(parsed.pages[1].empty).toBe(true)
    expect(parsed.pages[1].blocks).toEqual([])
  })

  it("recognises paragraphs, lists, headings and tables", () => {
    const [p1, , p3] = parseTwin(TWIN).pages
    expect(p1.blocks[0]).toEqual({ kind: "paragraph", text: "المجال التثاقلي" })
    expect(p1.blocks[2]).toEqual({
      kind: "list",
      ordered: false,
      items: ["أولاً", "ثانياً"],
    })
    expect(p3.blocks[0]).toEqual({
      kind: "heading",
      level: 2,
      text: "الحركة الدائرية",
    })
    expect(p3.blocks[1]).toEqual({
      kind: "table",
      rows: [
        ["الكمية", "الوحدة"],
        ["السرعة", "م/ث"],
      ],
    })
    expect(p3.blocks[2]).toEqual({
      kind: "list",
      ordered: true,
      items: ["خطوة أولى", "خطوة ثانية"],
    })
  })

  it("treats a marker-less twin as one unnumbered page and drops the bare title", () => {
    const parsed = parseTwin(
      "---\nlang: en\n---\n\n# Title\n\nFirst para.\n\nSecond.\n"
    )
    expect(parsed.hasPageMarkers).toBe(false)
    expect(parsed.pages).toHaveLength(1)
    expect(parsed.pages[0].number).toBeNull()
    expect(parsed.pages[0].blocks.map((b) => b.kind)).toEqual([
      "heading",
      "paragraph",
      "paragraph",
    ])
  })

  it("never treats angle brackets or braces as markup", () => {
    const parsed = parseTwin("<!-- page 1 -->\n\nx < y {a} <b>\n")
    expect(parsed.pages[0].blocks[0]).toEqual({
      kind: "paragraph",
      text: "x < y {a} <b>",
    })
  })
})

describe("cleanInline", () => {
  it("strips emphasis markers, escapes and cid tokens", () => {
    expect(cleanInline("**bold** and \\_x\\_ (cid:12) *it*")).toBe(
      "bold and _x_ it"
    )
  })
})

describe("normalizeForSearch", () => {
  it("folds diacritics, hamza seats, taa marbuta and alef maqsura", () => {
    expect(normalizeForSearch("الحَرَكَةُ الدَّائريّةُ")).toBe(
      "الحركه الدايريه"
    )
    expect(normalizeForSearch("أحمد إلى آخر")).toBe("احمد الي اخر")
    expect(normalizeForSearch("  Hello   World ")).toBe("hello world")
  })

  it("normalizeWithMap maps every normalised char back to its source index", () => {
    const src = "الحَرَكَة  الدائرية"
    const { norm, map } = normalizeWithMap(src)
    expect(norm).toBe(normalizeForSearch(src))
    expect(map).toHaveLength(norm.length)
    // the first char of the second word maps to the source index of "ا" after the gap
    const at = norm.indexOf("الدايريه")
    expect(src[map[at]]).toBe("ا")
    expect(src[map[norm.length - 1]]).toBe("ة")
  })
})

describe("anchorToc", () => {
  it("anchors chapters and lessons to the page whose text starts with their name, in order", () => {
    const parsed = parseTwin(TWIN)
    const toc = anchorToc(parsed.pages, [
      {
        id: "c1",
        name: "المجال التثاقلي",
        lessons: [{ id: "l1", name: "الحركة الدائرية" }],
      },
      { id: "c2", name: "غير موجود", lessons: [] },
    ])
    expect(toc[0].anchor).toBe("p-1")
    expect(toc[0].children[0].anchor).toBe("p-3")
    expect(toc[1].anchor).toBeNull()
  })

  it("falls back to token overlap when the OCR heading lost a word", () => {
    const parsed = parseTwin(
      "<!-- page 7 -->\n\nالعوامل المؤثرة في سرعة التفاعل الكيميائي\n\nنص.\n"
    )
    const toc = anchorToc(parsed.pages, [
      {
        id: "c",
        name: "العوامل المؤثرة على سرعة التفاعل الكيميائي",
        lessons: [],
      },
    ])
    expect(toc[0].anchor).toBe("p-7")
  })
})

describe("folios and detectPageOffset", () => {
  const book = [
    "<!-- page 9 -->\n\nمقدمة\n\nنص المقدمة.\n",
    ...Array.from({ length: 12 }, (_, i) => {
      const pdf = 10 + i
      const printed = pdf - 8
      // The printed number sits alone at the foot of the page, sometimes in Arabic-Indic digits.
      const folio =
        i % 2
          ? String(printed)
          : String(printed).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)])
      return `<!-- page ${pdf} -->\n\nفقرة في الصفحة ${pdf}.\n\n${folio}\n`
    }),
  ].join("\n")

  it("reads the lone number at the foot of a page as its folio and drops it from the text", () => {
    const parsed = parseTwin(book)
    const p10 = parsed.pages.find((p) => p.number === 10)!
    expect(p10.folio).toBe(2)
    expect(p10.blocks).toEqual([
      { kind: "paragraph", text: "فقرة في الصفحة 10." },
    ])
    expect(parsed.pages.find((p) => p.number === 9)!.folio).toBeNull()
  })

  it("votes the PDF→printed offset across the book", () => {
    expect(detectPageOffset(parseTwin(book).pages)).toBe(8)
  })

  it("returns null when too few pages carry a folio", () => {
    expect(detectPageOffset(parseTwin(TWIN).pages)).toBeNull()
  })

  it("ignores numbers larger than the PDF index (figure numbers, years)", () => {
    const parsed = parseTwin(
      "<!-- page 3 -->\n\nنص\n\n2005\n\n<!-- page 4 -->\n\nنص\n\n120\n"
    )
    expect(parsed.pages.map((p) => p.folio)).toEqual([null, null])
    expect(parsed.pages[0].blocks).toHaveLength(2)
  })
})

describe("spine", () => {
  const chapters = [
    {
      id: "c1",
      name: "المجال التثاقلي",
      lessons: [{ id: "l1", name: "الحركة الدائرية" }],
    },
    {
      id: "c2",
      name: "الموجات والضوء",
      lessons: [{ id: "l2", name: "الانكسار" }],
    },
  ]

  it("normalizeStructure keeps titles and positive integer pages only", () => {
    expect(
      normalizeStructure({
        pageNumbers: "book",
        chapters: [
          {
            title: "أ",
            page: 2,
            lessons: [
              { title: "x", page: "7" },
              { title: "y", page: 0 },
            ],
          },
          { title: "ب" },
        ],
      })
    ).toEqual({
      pageNumbers: "book",
      pageOffset: null,
      chapters: [
        {
          title: "أ",
          page: 2,
          lessons: [
            { title: "x", page: 7 },
            { title: "y", page: null },
          ],
        },
        { title: "ب", page: null, lessons: [] },
      ],
    })
    expect(normalizeStructure({ chapters: "no" })).toBeNull()
    expect(normalizeStructure(null)).toBeNull()
  })

  it("resolveToc maps printed structure pages through the offset, in book order", () => {
    const structure = normalizeStructure({
      pageNumbers: "book",
      chapters: [
        {
          title: "المجال التثاقلي",
          page: 2,
          lessons: [{ title: "الحركة الدائرية", page: 19 }],
        },
        {
          title: "الموجات والضوء",
          page: 59,
          lessons: [{ title: "الانكسار", page: 96 }],
        },
      ],
    })
    const toc = resolveToc(chapters, structure, 8, 218, [])
    expect(toc.map((c) => c.page)).toEqual([10, 67])
    expect(toc[0].lessons[0].page).toBe(27)
    expect(toc[1].lessons[0].page).toBe(104)
  })

  it("resolveToc falls back to name anchors and drops out-of-order pages", () => {
    const structure = normalizeStructure({
      pageNumbers: "pdf",
      chapters: [
        { title: "المجال التثاقلي", page: 50, lessons: [] },
        { title: "الموجات والضوء", page: 20, lessons: [] }, // earlier than chapter 1 → dropped
      ],
    })
    const anchors = [
      {
        id: "c1",
        name: "",
        anchor: "p-5",
        children: [{ id: "l1", name: "", anchor: "p-6", children: [] }],
      },
      {
        id: "c2",
        name: "",
        anchor: "p-70",
        children: [{ id: "l2", name: "", anchor: "p-80", children: [] }],
      },
    ]
    const toc = resolveToc(chapters, structure, null, 218, anchors)
    expect(toc.map((c) => c.page)).toEqual([50, 70])
    // anchor p-6 lies before its chapter start (50): a mis-anchor, so it is dropped
    expect(toc[0].lessons[0].page).toBeNull()
    expect(toc[1].lessons[0].page).toBe(80)
  })

  it("resolveToc without a structure uses the anchors alone", () => {
    const toc = resolveToc(chapters, null, 8, 218, [
      { id: "c1", name: "", anchor: "p-10", children: [] },
      { id: "c2", name: "", anchor: null, children: [] },
    ])
    expect(toc.map((c) => c.page)).toEqual([10, null])
  })

  it("groupSections cuts the book at chapter starts with the front matter first", () => {
    const md = Array.from(
      { length: 12 },
      (_, i) => `<!-- page ${i + 1} -->\n\nنص ${i + 1}\n`
    ).join("\n")
    const pages = parseTwin(md).pages
    const toc = [
      { id: "c1", name: "أ", page: 4, lessons: [] },
      { id: "c2", name: "ب", page: 9, lessons: [] },
    ]
    const sections = groupSections(pages, toc, true)
    expect(
      sections.map((s) => [
        s.kind,
        s.chapterIndex,
        s.pages.map((p) => p.number),
      ])
    ).toEqual([
      ["front", null, [1, 2, 3]],
      ["chapter", 0, [4, 5, 6, 7, 8]],
      ["chapter", 1, [9, 10, 11, 12]],
    ])
  })

  it("groupSections falls back to fixed chunks when no chapter can be placed", () => {
    const md = Array.from(
      { length: 25 },
      (_, i) => `<!-- page ${i + 1} -->\n\nنص ${i + 1}\n`
    ).join("\n")
    const sections = groupSections(
      parseTwin(md).pages,
      [{ id: "c", name: "x", page: null, lessons: [] }],
      true
    )
    expect(sections.map((s) => s.pages.length)).toEqual([10, 10, 5])
    expect(sections.every((s) => s.kind === "chunk")).toBe(true)
  })

  it("groupSections skips empty pages and treats a marker-less twin as one flow", () => {
    const withEmpty = parseTwin(
      "<!-- page 1 -->\n\nنص\n\n<!-- page 2: no text recognised -->\n<!-- page 3 -->\n\nنص\n"
    ).pages
    expect(
      groupSections(
        withEmpty,
        [{ id: "c", name: "x", page: 1, lessons: [] }],
        true
      )[0].pages.map((p) => p.number)
    ).toEqual([1, 3])
    const single = parseTwin("---\nlang: en\n---\n\nSome text.\n").pages
    expect(groupSections(single, [], false)).toEqual([
      { kind: "chunk", chapterIndex: null, pages: single },
    ])
  })
})

describe("isNoisePage", () => {
  it("flags a front-matter page that is mostly digits and symbols", () => {
    const [noise, prose] = parseTwin(
      "<!-- page 1 -->\n\nالمناهج الدراسية السودانية\n\n1 171 2 7 5 7 2 - 7 6 2 2 3 -327 0 2 4 1 6 2 - 52 0 -- 3 . 7\n\n<!-- page 6 -->\n\nيسرنا أن نقدم هذا الكتاب الثالث في الفيزياء للمرحلة الثانوية.\n"
    ).pages
    expect(isNoisePage(noise)).toBe(true)
    expect(isNoisePage(prose)).toBe(false)
  })

  it("keeps such a page out of the front matter but never out of a chapter", () => {
    const pages = parseTwin(
      "<!-- page 1 -->\n\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 ab\n\n<!-- page 2 -->\n\nمقدمة الكتاب\n\n<!-- page 3 -->\n\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 ab\n"
    ).pages
    const sections = groupSections(
      pages,
      [{ id: "c", name: "x", page: 3, lessons: [] }],
      true
    )
    expect(sections.map((s) => [s.kind, s.pages.map((p) => p.number)])).toEqual(
      [
        ["front", [2]],
        ["chapter", [3]],
      ]
    )
  })
})

describe("page offset from the structure", () => {
  const page = (number: number, ...texts: string[]) => ({
    number,
    empty: false,
    folio: null,
    blocks: texts.map((text) => ({ kind: "paragraph" as const, text })),
  })
  const structure = normalizeStructure({
    pageNumbers: "book",
    chapters: [
      {
        title: "التكاثر غير الجنسي",
        page: 1,
        lessons: [{ title: "خصائص التكاثر غير الجنسي", page: 2 }],
      },
      {
        title: "تجارب وقوانين مندل",
        page: 132,
        lessons: [{ title: "قانون مندل الأول", page: 136 }],
      },
      { title: "الطفرات", page: 189, lessons: [] },
    ],
  })
  // Printed = PDF − 8: a contents page lists every title, headings sit on
  // their pages, and a title also recurs in running text two pages later.
  const pages = [
    page(1, "المناهج الدراسية السودانية", "الصف الثالث ثانوي"),
    page(
      7,
      "محتويات الوحدة",
      "التكاثر غير الجنسي 1",
      "خصائص التكاثر غير الجنسي 2",
      "تجارب وقوانين مندل 132",
      "قانون مندل الأول 136",
      "الطفرات 189"
    ),
    page(9, "التكاثر غير الجنسي هو إنتاج أفراد جديدة"),
    page(10, "خصائص التكاثر غير الجنسي كثيرة"),
    page(140, "تجارب وقوانين مندل بدأت في حديقة الدير"),
    page(144, "قانون مندل الأول ينص على"),
    page(146, "وهكذا يفسر قانون مندل الأول النتائج"),
    page(197, "الطفرات تغيرات فجائية"),
  ]

  it("normalizeStructure reads a non-negative pageOffset", () => {
    expect(
      normalizeStructure({ pageOffset: 8, chapters: [] })?.pageOffset
    ).toBe(8)
    expect(
      normalizeStructure({ pageOffset: "0", chapters: [] })?.pageOffset
    ).toBe(0)
    expect(
      normalizeStructure({ pageOffset: -3, chapters: [] })?.pageOffset
    ).toBeNull()
  })

  it("inferPageOffset votes the offset from headings, ignoring the contents page", () => {
    expect(inferPageOffset(pages, structure)).toBe(8)
    // Too few agreeing pages: no guess.
    expect(inferPageOffset(pages.slice(0, 4), structure)).toBeNull()
    // PDF-numbered structures need no offset.
    expect(
      inferPageOffset(
        pages,
        structure ? { ...structure, pageNumbers: "pdf" } : null
      )
    ).toBeNull()
    expect(inferPageOffset(pages, null)).toBeNull()
  })

  it("resolvePageOffset prefers the author's offset, then folios, then inference", () => {
    expect(
      resolvePageOffset(
        pages,
        structure ? { ...structure, pageOffset: 11 } : null
      )
    ).toBe(11)
    const withFolios = pages.map((p) =>
      p.number >= 9 ? { ...p, folio: p.number - 6 } : p
    )
    expect(resolvePageOffset(withFolios, structure)).toBe(6)
    expect(resolvePageOffset(pages, structure)).toBe(8)
    expect(resolvePageOffset(pages, null)).toBeNull()
  })

  it("resolveToc keeps a chapter that opens on its predecessor's page", () => {
    const shared = normalizeStructure({
      pageNumbers: "book",
      pageOffset: 8,
      chapters: [
        { title: "الهندسة الوراثية", page: 199, lessons: [] },
        { title: "الاستشارة الوراثية", page: 199, lessons: [] },
        { title: "الدورات", page: 190, lessons: [] },
      ],
    })
    const toc = resolveToc(
      [
        { id: "a", name: "الهندسة الوراثية", lessons: [] },
        { id: "b", name: "الاستشارة الوراثية", lessons: [] },
        { id: "c", name: "الدورات", lessons: [] },
      ],
      shared,
      8,
      253,
      []
    )
    expect(toc.map((c) => c.page)).toEqual([207, 207, null])
    // One flow for the shared page: the second chapter has no section of its own.
    const sections = groupSections(
      [page(207, "الهندسة الوراثية"), page(208, "الاستشارة")],
      toc,
      true
    )
    expect(sections.map((s) => s.chapterIndex)).toEqual([0])
  })

  it("isCoverPage flags a short first page only", () => {
    expect(isCoverPage(pages[0])).toBe(true)
    expect(isCoverPage(pages[2])).toBe(false)
    expect(
      isCoverPage(page(1, Array.from({ length: 80 }, () => "كلمة").join(" ")))
    ).toBe(false)
  })
})
