import { describe, expect, it } from "vitest"

import {
  anchorToc,
  cleanInline,
  normalizeForSearch,
  normalizeWithMap,
  parseFrontMatter,
  parseTwin,
} from "@/components/school-dashboard/listings/subjects/textbook/parse"

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
