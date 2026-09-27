// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  catalogBase,
  catalogKey,
  catalogLegacyPrefix,
  catalogSibling,
  chapterSlug,
  encodeCatalogKey,
  lessonSlug,
} from "@/components/catalog/catalog-key"

const BIOLOGY = {
  curriculum: "sd",
  grade: "g12",
  subjectDir: "biology",
} as const

describe("catalogBase", () => {
  it("builds the subject directory", () => {
    expect(catalogBase(BIOLOGY)).toBe("catalog/sd/g12/biology")
  })

  it("nests chapter and lesson flat — no chapters/ or lessons/ segment", () => {
    expect(
      catalogBase({
        ...BIOLOGY,
        chapterSlug: "c1",
        lessonSlug: "l1",
      })
    ).toBe("catalog/sd/g12/biology/c1/l1")
  })

  it("refuses a lesson without its chapter", () => {
    expect(() => catalogBase({ ...BIOLOGY, lessonSlug: "l1" })).toThrow(
      /lessonSlug given without chapterSlug/
    )
  })

  it.each([
    ["empty", ""],
    ["slash", "a/b"],
    ["parent", ".."],
    ["dotfile", ".DS_Store"],
  ])("rejects a %s subjectDir", (_label, subjectDir) => {
    expect(() => catalogBase({ ...BIOLOGY, subjectDir })).toThrow(
      /catalogKey: subjectDir/
    )
  })
})

describe("catalogKey", () => {
  it("appends a plain asset", () => {
    expect(catalogKey(BIOLOGY, "textbook.md")).toBe(
      "catalog/sd/g12/biology/textbook.md"
    )
  })

  it("keeps pages/<N>.webp as a two-segment asset", () => {
    expect(catalogKey(BIOLOGY, "pages/253.webp")).toBe(
      "catalog/sd/g12/biology/pages/253.webp"
    )
  })

  it("rejects a malformed page asset", () => {
    expect(() =>
      catalogKey(BIOLOGY, "pages/../secret.webp" as `pages/${number}.webp`)
    ).toThrow(/malformed page asset/)
  })

  it("never appends a size suffix — image-url.ts owns that", () => {
    expect(catalogKey(BIOLOGY, "thumbnail.jpg")).toBe(
      "catalog/sd/g12/biology/thumbnail.jpg"
    )
  })
})

describe("catalogSibling", () => {
  // This is the runtime path. It must keep working against BOTH prefixes, so
  // the textbook reader survives the flip with no code change.
  it("derives a sibling from a new-scheme key", () => {
    expect(
      catalogSibling("catalog/sd/g12/biology/textbook.pdf", "textbook.md")
    ).toBe("catalog/sd/g12/biology/textbook.md")
  })

  it("derives a sibling from a LEGACY key too", () => {
    expect(
      catalogSibling(
        "catalog/textbooks/sd-g12-biology/textbook.pdf",
        "structure.json"
      )
    ).toBe("catalog/textbooks/sd-g12-biology/structure.json")
  })

  it("walks down into a chapter", () => {
    expect(
      catalogSibling(
        "catalog/sd/g12/biology/textbook.pdf",
        "c1",
        "l3",
        "qbank.json"
      )
    ).toBe("catalog/sd/g12/biology/c1/l3/qbank.json")
  })

  it("matches the inline expression the reader uses today", () => {
    const stored = "catalog/sd/g12/biology/textbook.pdf"
    const inline = `${stored.replace(/\/[^/]+$/, "")}/textbook.md`
    expect(catalogSibling(stored, "textbook.md")).toBe(inline)
  })

  it("throws on a key with no parent directory", () => {
    expect(() => catalogSibling("textbook.pdf", "textbook.md")).toThrow(
      /no parent directory/
    )
  })
})

describe("encodeCatalogKey", () => {
  it("leaves an ASCII key alone", () => {
    expect(encodeCatalogKey("catalog/sd/g12/biology/textbook.md")).toBe(
      "catalog/sd/g12/biology/textbook.md"
    )
  })

  it("encodes Arabic slugs without eating the separators", () => {
    // 61 lesson slugs under sd-g5 are raw Arabic; a whole-key
    // encodeURIComponent would turn every "/" into %2F.
    const key = "catalog/sd/g5/history/01-chapter/01-السودان"
    const encoded = encodeCatalogKey(key)
    expect(encoded.split("/")).toHaveLength(key.split("/").length)
    expect(encoded).toContain("catalog/sd/g5/history/")
    expect(decodeURIComponent(encoded.split("/").pop()!)).toBe("01-السودان")
  })
})

describe("catalogLegacyPrefix", () => {
  it("rebuilds the flat prefix with its trailing slash", () => {
    expect(catalogLegacyPrefix("sd-g12-biology")).toBe(
      "catalog/textbooks/sd-g12-biology/"
    )
  })
})

describe("the catalog rule: path, key and subject id agree", () => {
  it("derives the base from the same three segments as the subject id", () => {
    // github.com/databayt/catalog mirrors the CDN: sd/g12/biology/… is
    // catalog/sd/g12/biology/…, and the subject id is sd-g12-biology.
    for (const [curriculum, grade, subjectDir] of [
      ["sd", "g12", "biology"],
      ["sd", "g1", "islamic-studies"],
      ["ib-dp", "g12", "math"],
    ] as const) {
      expect(catalogBase({ curriculum, grade, subjectDir })).toBe(
        `catalog/${curriculum}/${grade}/${subjectDir}`
      )
    }
  })

  it("names chapters and lessons by position", () => {
    expect(chapterSlug(1)).toBe("c1")
    expect(lessonSlug(12)).toBe("l12")
  })
})
