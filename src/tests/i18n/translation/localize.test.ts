// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { localize } from "@/components/translation/localize"
import { memoClear } from "@/components/translation/memory-cache"

// --- Mocks (hoisted by vitest) -------------------------------------------------
const { findMany, upsert, $transaction, translateBatch } = vi.hoisted(() => ({
  findMany: vi.fn(),
  upsert: vi.fn(() => ({})),
  $transaction: vi.fn(() => Promise.resolve([])),
  translateBatch: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: { translation: { findMany, upsert }, $transaction },
}))

vi.mock("@/components/translation/engine", () => ({ translateBatch }))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(async () => ({ schoolId: "school-ambient" })),
}))

vi.mock("@/components/translation/locale", () => ({
  getDisplayLang: vi.fn(async () => "en"),
}))

const opts = { schoolId: "s1", lang: "en" as const }

beforeEach(() => {
  vi.clearAllMocks()
  memoClear()
  findMany.mockResolvedValue([])
  translateBatch.mockResolvedValue([])
})

describe("localize", () => {
  it("translates a whole list in ONE batched db query (not N×findUnique)", async () => {
    findMany.mockResolvedValue([
      { sourceText: "عنوان ١", translatedText: "Title 1" },
      { sourceText: "عنوان ٢", translatedText: "Title 2" },
    ])
    const rows = [
      { id: 1, title: "عنوان ١", lang: "ar" },
      { id: 2, title: "عنوان ٢", lang: "ar" },
    ]

    const out = await localize("Announcement", rows, opts)

    expect(findMany).toHaveBeenCalledTimes(1)
    expect(translateBatch).not.toHaveBeenCalled()
    expect(out[0].title).toBe("Title 1")
    expect(out[1].title).toBe("Title 2")
  })

  it("short-circuits with ZERO work when content is already in the display language", async () => {
    const rows = [{ id: 1, title: "Hello", lang: "en" }]
    const out = await localize("Announcement", rows, opts)

    expect(findMany).not.toHaveBeenCalled()
    expect(translateBatch).not.toHaveBeenCalled()
    expect(out).toBe(rows) // same reference — nothing copied
  })

  it("serves repeated hot terms from the in-memory LRU (no DB round-trip)", async () => {
    findMany.mockResolvedValue([{ sourceText: "مرحبا", translatedText: "Hi" }])
    await localize(
      "Announcement",
      [{ id: 1, title: "مرحبا", lang: "ar" }],
      opts
    )
    expect(findMany).toHaveBeenCalledTimes(1)

    findMany.mockClear()
    const out = await localize(
      "Announcement",
      [{ id: 2, title: "مرحبا", lang: "ar" }],
      opts
    )

    expect(findMany).not.toHaveBeenCalled() // LRU answered it
    expect(out[0].title).toBe("Hi")
  })

  it("falls back to Google only for true cache misses, then persists them", async () => {
    findMany.mockResolvedValue([]) // cache miss
    translateBatch.mockResolvedValue(["Hello World"])

    const out = await localize(
      "Announcement",
      [{ id: 1, title: "مرحبا", lang: "ar" }],
      opts
    )

    expect(translateBatch).toHaveBeenCalledWith(["مرحبا"], "ar", "en")
    expect($transaction).toHaveBeenCalledTimes(1) // upserts the fresh translation
    expect(out[0].title).toBe("Hello World")
  })

  it("renders the source string (never blocks) when translation fails", async () => {
    findMany.mockResolvedValue([])
    translateBatch.mockRejectedValue(new Error("API down"))

    const out = await localize(
      "Announcement",
      [{ id: 1, title: "مرحبا", lang: "ar" }],
      opts
    )

    expect(out[0].title).toBe("مرحبا") // source fallback, not blank
  })

  it("uses detected script as source-truth, ignoring a wrong stored lang flag", async () => {
    // Row CLAIMS English but the text is Arabic — must still translate.
    findMany.mockResolvedValue([
      { sourceText: "مرحبا", translatedText: "Hello" },
    ])
    const out = await localize(
      "Announcement",
      [{ id: 1, title: "مرحبا", lang: "en" }],
      opts
    )
    expect(out[0].title).toBe("Hello")
  })

  it("is non-destructive — input rows are untouched", async () => {
    findMany.mockResolvedValue([{ sourceText: "مرحبا", translatedText: "Hi" }])
    const rows = [{ id: 1, title: "مرحبا", lang: "ar" }]
    await localize("Announcement", rows, opts)
    expect(rows[0].title).toBe("مرحبا") // original unchanged
  })

  it("returns rows untouched when there is no tenant (no schoolId)", async () => {
    const rows = [{ id: 1, title: "مرحبا", lang: "ar" }]
    const out = await localize("Announcement", rows, {
      schoolId: null,
      lang: "en",
    })
    expect(out).toBe(rows)
    expect(findMany).not.toHaveBeenCalled()
  })

  it("ignores unregistered models", async () => {
    const rows = [{ id: 1, title: "مرحبا" }]
    const out = await localize("NotARealModel", rows, opts)
    expect(out).toBe(rows)
    expect(findMany).not.toHaveBeenCalled()
  })
})
