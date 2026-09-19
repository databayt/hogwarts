// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  catalogBase,
  catalogKey,
  catalogLegacyPrefix,
  catalogSibling,
  encodeCatalogKey,
} from "@/components/catalog/catalog-key"

import manifest from "../../../prisma/seeds/catalog/sd-subject-dirs.json"

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
        chapterSlug: "01-asexual-reproduction",
        lessonSlug: "01-characteristics-of-asexual-reproduction",
      })
    ).toBe(
      "catalog/sd/g12/biology/01-asexual-reproduction/01-characteristics-of-asexual-reproduction"
    )
  })

  it("refuses a lesson without its chapter", () => {
    expect(() =>
      catalogBase({ ...BIOLOGY, lessonSlug: "01-whatever" })
    ).toThrow(/lessonSlug given without chapterSlug/)
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
        "01-asexual-reproduction",
        "qbank.json"
      )
    ).toBe("catalog/sd/g12/biology/01-asexual-reproduction/qbank.json")
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

describe("sd-subject-dirs.json manifest", () => {
  const entries = manifest as {
    slug: string
    curriculum: string
    grade: string
    subjectDir: string
    source: string
  }[]

  it("covers every row that carries the legacy prefix", () => {
    // 138, not 137: sd-g8-art has art keys and no pdf.
    expect(entries).toHaveLength(138)
    expect(entries.some((e) => e.slug === "sd-g8-art")).toBe(true)
  })

  it("produces a valid, unique base path for every entry", () => {
    const seen = new Map<string, string>()
    for (const e of entries) {
      const base = catalogBase(e)
      expect(base.startsWith("catalog/sd/")).toBe(true)
      const clash = seen.get(base)
      expect(
        clash,
        `${e.slug} and ${clash} both map to ${base}`
      ).toBeUndefined()
      seen.set(base, e.slug)
    }
    expect(seen.size).toBe(entries.length)
  })

  it("keeps the folder name, not the slug suffix", () => {
    // The decision this whole scheme turns on. 42 of 138 disagree.
    const byslug = new Map(entries.map((e) => [e.slug, e]))
    expect(catalogBase(byslug.get("sd-g12-basic-math")!)).toBe(
      "catalog/sd/g12/math"
    )
    expect(catalogBase(byslug.get("sd-g1-islamic-studies")!)).toBe(
      "catalog/sd/g1/islamic"
    )
    expect(catalogBase(byslug.get("sd-g12-biology")!)).toBe(
      "catalog/sd/g12/biology"
    )
  })

  it("resolves the three CDN-only rows by explicit override", () => {
    const overrides = entries.filter((e) => e.source === "override")
    expect(overrides.map((e) => e.slug).sort()).toEqual([
      "sd-g10-arabic-advanced",
      "sd-g10-literature",
      "sd-g10-rhetoric",
    ])
  })
})
