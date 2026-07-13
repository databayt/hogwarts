// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { memoClear, memoGet } from "@/components/translation/memory-cache"
import { prewarm } from "@/components/translation/prewarm"

const { upsert, $transaction, translateBatch } = vi.hoisted(() => ({
  upsert: vi.fn(() => ({})),
  $transaction: vi.fn(() => Promise.resolve([])),
  translateBatch: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: { translation: { upsert }, $transaction },
}))

vi.mock("@/components/translation/engine", () => ({ translateBatch }))

beforeEach(() => {
  vi.clearAllMocks()
  memoClear()
  translateBatch.mockResolvedValue([])
})

describe("prewarm (write-path cache warming)", () => {
  it("no-ops without a row or schoolId or registry entry", async () => {
    await prewarm("Announcement", null, { schoolId: "s1" })
    await prewarm("Announcement", { title: "هلا" }, { schoolId: null })
    await prewarm("NotARealModel", { title: "هلا" }, { schoolId: "s1" })
    expect(translateBatch).not.toHaveBeenCalled()
    expect($transaction).not.toHaveBeenCalled()
  })

  it("groups by PER-VALUE script direction — a mixed-script row makes two batches", async () => {
    translateBatch.mockResolvedValue(["out"])
    await prewarm(
      "Announcement",
      { title: "إعلان مهم", body: "English body" },
      { schoolId: "s1" }
    )
    expect(translateBatch).toHaveBeenCalledTimes(2)
    expect(translateBatch).toHaveBeenCalledWith(["إعلان مهم"], "ar", "en", {
      retry: true,
    })
    expect(translateBatch).toHaveBeenCalledWith(["English body"], "en", "ar", {
      retry: true,
    })
  })

  it("opts into retry (it runs OFF the response path — unlike the read tier)", async () => {
    translateBatch.mockResolvedValue(["Hi"])
    await prewarm("Announcement", { title: "مرحبا" }, { schoolId: "s1" })
    expect(translateBatch).toHaveBeenCalledWith(expect.any(Array), "ar", "en", {
      retry: true,
    })
  })

  it("NEVER clobbers an existing translation — upsert update touches recency only", async () => {
    translateBatch.mockResolvedValue(["Hello"])
    await prewarm("Announcement", { title: "مرحبا" }, { schoolId: "s1" })
    expect(upsert).toHaveBeenCalledTimes(1)
    const arg = upsert.mock.calls[0][0] as {
      update: Record<string, unknown>
      create: Record<string, unknown>
    }
    expect(Object.keys(arg.update)).toEqual(["lastAccessedAt"]) // no translatedText!
    expect(arg.create).toMatchObject({
      sourceText: "مرحبا",
      translatedText: "Hello",
      provider: "google",
    })
  })

  it("fills the in-memory LRU so the very next read is zero-roundtrip", async () => {
    translateBatch.mockResolvedValue(["Hello"])
    await prewarm("Announcement", { title: "مرحبا" }, { schoolId: "s1" })
    expect(memoGet("s1", "ar", "en", "مرحبا")).toBe("Hello")
  })

  it("skips empty translations and empty/non-string fields", async () => {
    translateBatch.mockResolvedValue([""])
    await prewarm(
      "Announcement",
      { title: "مرحبا", body: "   " },
      { schoolId: "s1" }
    )
    expect(translateBatch).toHaveBeenCalledWith(["مرحبا"], "ar", "en", {
      retry: true,
    }) // whitespace body never sent
    expect(upsert).not.toHaveBeenCalled() // empty translation → nothing to persist
  })

  it("swallows Google failures — a failed prewarm must never throw into after()", async () => {
    translateBatch.mockRejectedValue(new Error("quota"))
    await expect(
      prewarm("Announcement", { title: "مرحبا" }, { schoolId: "s1" })
    ).resolves.toBeUndefined()
  })

  it("swallows DB persistence failures (LRU still warmed)", async () => {
    translateBatch.mockResolvedValue(["Hello"])
    $transaction.mockRejectedValueOnce(new Error("db down"))
    await expect(
      prewarm("Announcement", { title: "مرحبا" }, { schoolId: "s1" })
    ).resolves.toBeUndefined()
    expect(memoGet("s1", "ar", "en", "مرحبا")).toBe("Hello")
  })
})
