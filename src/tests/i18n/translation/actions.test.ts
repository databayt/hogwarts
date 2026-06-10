// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  translate,
  translateFields,
  translateText,
} from "@/components/translation/actions"
import { translateBatch, translateRaw } from "@/components/translation/google"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    translation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock("@/components/translation/google", () => ({
  translateRaw: vi.fn(),
  translateBatch: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

describe("translate", () => {
  const schoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns empty string for empty text", async () => {
    const result = await translate("", "en", "ar", schoolId)
    expect(result).toBe("")
    expect(db.translation.findUnique).not.toHaveBeenCalled()
  })

  it("returns empty string for whitespace-only text", async () => {
    const result = await translate("   ", "en", "ar", schoolId)
    expect(result).toBe("")
    expect(db.translation.findUnique).not.toHaveBeenCalled()
  })

  it("returns text unchanged when source and target language are the same", async () => {
    const result = await translate("hello", "en", "en", schoolId)
    expect(result).toBe("hello")
    expect(db.translation.findUnique).not.toHaveBeenCalled()
    expect(translateRaw).not.toHaveBeenCalled()
  })

  it("returns cached translation on cache hit and increments hitCount", async () => {
    const cachedEntry = {
      id: "cache-1",
      schoolId,
      sourceText: "hello",
      sourceLanguage: "en",
      targetLanguage: "ar",
      translatedText: "مرحبا",
      hitCount: 5,
    }

    vi.mocked(db.translation.findUnique).mockResolvedValue(cachedEntry)
    vi.mocked(db.translation.update).mockResolvedValue(cachedEntry)

    const result = await translate("hello", "en", "ar", schoolId)

    expect(result).toBe("مرحبا")
    expect(db.translation.findUnique).toHaveBeenCalledWith({
      where: {
        schoolId_sourceText_sourceLanguage_targetLanguage: {
          schoolId,
          sourceText: "hello",
          sourceLanguage: "en",
          targetLanguage: "ar",
        },
      },
    })
    expect(db.translation.update).toHaveBeenCalledWith({
      where: { id: "cache-1" },
      data: {
        hitCount: { increment: 1 },
        lastAccessedAt: expect.any(Date),
      },
    })
    expect(translateRaw).not.toHaveBeenCalled()
  })

  it("calls translateRaw on cache miss and creates cache entry", async () => {
    vi.mocked(db.translation.findUnique).mockResolvedValue(null)
    vi.mocked(translateRaw).mockResolvedValue("مرحبا")
    vi.mocked(db.translation.create).mockResolvedValue({} as never)

    const result = await translate("hello", "en", "ar", schoolId)

    expect(result).toBe("مرحبا")
    expect(translateRaw).toHaveBeenCalledWith("hello", "en", "ar")
    expect(db.translation.create).toHaveBeenCalledWith({
      data: {
        schoolId,
        sourceText: "hello",
        sourceLanguage: "en",
        targetLanguage: "ar",
        translatedText: "مرحبا",
        provider: "google",
      },
    })
  })

  it("does not throw when cache create fails (race condition tolerance)", async () => {
    vi.mocked(db.translation.findUnique).mockResolvedValue(null)
    vi.mocked(translateRaw).mockResolvedValue("مرحبا")
    vi.mocked(db.translation.create).mockRejectedValue(
      new Error("Unique constraint violation")
    )

    const result = await translate("hello", "en", "ar", schoolId)
    expect(result).toBe("مرحبا")
  })

  it("does not throw when hitCount update fails", async () => {
    const cachedEntry = {
      id: "cache-1",
      schoolId,
      sourceText: "hello",
      sourceLanguage: "en",
      targetLanguage: "ar",
      translatedText: "مرحبا",
      hitCount: 5,
    }

    vi.mocked(db.translation.findUnique).mockResolvedValue(cachedEntry)
    vi.mocked(db.translation.update).mockRejectedValue(new Error("DB error"))

    const result = await translate("hello", "en", "ar", schoolId)
    expect(result).toBe("مرحبا")
  })
})

describe("translateText", () => {
  const schoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const result = await translateText({ text: "hello", sourceLanguage: "en" })

    expect(result).toEqual({
      success: false,
      error: "Not authenticated",
    })
  })

  it("returns error when session has no user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: undefined } as never)

    const result = await translateText({ text: "hello", sourceLanguage: "en" })

    expect(result).toEqual({
      success: false,
      error: "Not authenticated",
    })
  })

  it("returns error when school context is missing", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)

    const result = await translateText({ text: "hello", sourceLanguage: "en" })

    expect(result).toEqual({
      success: false,
      error: "Missing school context",
    })
  })

  it("returns empty string for empty text input", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)

    const result = await translateText({ text: "", sourceLanguage: "en" })

    expect(result).toEqual({ success: true, translated: "" })
  })

  it("returns empty string for whitespace-only text input", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)

    const result = await translateText({ text: "   ", sourceLanguage: "en" })

    expect(result).toEqual({ success: true, translated: "" })
  })

  it("translates English to Arabic successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)
    vi.mocked(db.translation.findUnique).mockResolvedValue(null)
    vi.mocked(translateRaw).mockResolvedValue("مرحبا")
    vi.mocked(db.translation.create).mockResolvedValue({} as never)

    const result = await translateText({
      text: "hello",
      sourceLanguage: "en",
    })

    expect(result).toEqual({ success: true, translated: "مرحبا" })
  })

  it("translates Arabic to English with correct target language", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "ar",
    } as never)
    vi.mocked(db.translation.findUnique).mockResolvedValue(null)
    vi.mocked(translateRaw).mockResolvedValue("hello")
    vi.mocked(db.translation.create).mockResolvedValue({} as never)

    const result = await translateText({
      text: "مرحبا",
      sourceLanguage: "ar",
    })

    expect(result).toEqual({ success: true, translated: "hello" })
    // Verify it computed targetLang as "en" when source is "ar"
    expect(translateRaw).toHaveBeenCalledWith("مرحبا", "ar", "en")
  })

  it("returns error when translation throws", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)
    vi.mocked(db.translation.findUnique).mockResolvedValue(null)
    vi.mocked(translateRaw).mockRejectedValue(new Error("API quota exceeded"))

    const result = await translateText({
      text: "hello",
      sourceLanguage: "en",
    })

    expect(result).toEqual({
      success: false,
      error: "API quota exceeded",
    })
  })
})

describe("translateFields", () => {
  const schoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const result = await translateFields({
      fields: { title: "hello" },
      sourceLanguage: "en",
    })

    expect(result).toEqual({
      success: false,
      error: "Not authenticated",
    })
  })

  it("returns error when school context is missing", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)

    const result = await translateFields({
      fields: { title: "hello" },
      sourceLanguage: "en",
    })

    expect(result).toEqual({
      success: false,
      error: "Missing school context",
    })
  })

  it("returns empty object when all field values are empty", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)

    const result = await translateFields({
      fields: { title: "", body: "   " },
      sourceLanguage: "en",
    })

    expect(result).toEqual({ success: true, translated: {} })
  })

  it("translates multiple fields in batch successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)
    vi.mocked(translateBatch).mockResolvedValue(["مرحبا", "عالم"])
    vi.mocked(db.translation.upsert).mockResolvedValue({} as never)

    const result = await translateFields({
      fields: { title: "hello", body: "world" },
      sourceLanguage: "en",
    })

    expect(result).toEqual({
      success: true,
      translated: { title: "مرحبا", body: "عالم" },
    })
    expect(translateBatch).toHaveBeenCalledWith(["hello", "world"], "en", "ar")
  })

  it("filters out empty fields before batch translating", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)
    vi.mocked(translateBatch).mockResolvedValue(["مرحبا"])
    vi.mocked(db.translation.upsert).mockResolvedValue({} as never)

    const result = await translateFields({
      fields: { title: "hello", body: "", description: "  " },
      sourceLanguage: "en",
    })

    // Only non-empty field is translated
    expect(result).toEqual({
      success: true,
      translated: { title: "مرحبا" },
    })
    expect(translateBatch).toHaveBeenCalledWith(["hello"], "en", "ar")
  })

  it("upserts translation cache for each translated field", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)
    vi.mocked(translateBatch).mockResolvedValue(["مرحبا", "عالم"])
    vi.mocked(db.translation.upsert).mockResolvedValue({} as never)

    await translateFields({
      fields: { title: "hello", body: "world" },
      sourceLanguage: "en",
    })

    expect(db.translation.upsert).toHaveBeenCalledTimes(2)
    expect(db.translation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId_sourceText_sourceLanguage_targetLanguage: {
            schoolId,
            sourceText: "hello",
            sourceLanguage: "en",
            targetLanguage: "ar",
          },
        },
        create: expect.objectContaining({
          schoolId,
          sourceText: "hello",
          translatedText: "مرحبا",
          provider: "google",
        }),
      })
    )
  })

  it("returns error when batch translation throws", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    } as never)
    vi.mocked(translateBatch).mockRejectedValue(new Error("API error"))

    const result = await translateFields({
      fields: { title: "hello" },
      sourceLanguage: "en",
    })

    expect(result).toEqual({
      success: false,
      error: "API error",
    })
  })
})
