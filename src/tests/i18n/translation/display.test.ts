// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { translate } from "@/components/translation/actions"
import { getFields, getText } from "@/components/translation/display"

// --- Mocks (hoisted by vitest) -------------------------------------------------
const { translate: translateMock } = vi.hoisted(() => ({
  translate: vi.fn(),
}))

vi.mock("@/components/translation/actions", () => ({
  translate: translateMock,
}))

// Silence the intentional console.error fallback log in getText (cross-lang catch).
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("getText", () => {
  const schoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Empty / nullish inputs ------------------------------------------------
  it("returns empty string for null text", async () => {
    const result = await getText(null, "ar", "en", schoolId)
    expect(result).toBe("")
    expect(translate).not.toHaveBeenCalled()
  })

  it("returns empty string for undefined text", async () => {
    const result = await getText(undefined, "ar", "en", schoolId)
    expect(result).toBe("")
    expect(translate).not.toHaveBeenCalled()
  })

  it("returns empty string for empty string text", async () => {
    const result = await getText("", "ar", "en", schoolId)
    expect(result).toBe("")
    expect(translate).not.toHaveBeenCalled()
  })

  it("returns empty string for whitespace-only text", async () => {
    const result = await getText("   ", "ar", "en", schoolId)
    expect(result).toBe("")
    expect(translate).not.toHaveBeenCalled()
  })

  // --- Same-language passthrough --------------------------------------------
  it("returns text directly when content and display language are the same", async () => {
    const result = await getText("مرحبا", "ar", "ar", schoolId)
    expect(result).toBe("مرحبا")
    expect(translate).not.toHaveBeenCalled()
  })

  it("returns text directly for same language (English)", async () => {
    const result = await getText("hello", "en", "en", schoolId)
    expect(result).toBe("hello")
    expect(translate).not.toHaveBeenCalled()
  })

  // --- Cross-language translation -------------------------------------------
  it("calls translate when languages differ", async () => {
    vi.mocked(translate).mockResolvedValue("hello")

    const result = await getText("مرحبا", "ar", "en", schoolId)

    expect(result).toBe("hello")
    expect(translate).toHaveBeenCalledWith("مرحبا", "ar", "en", schoolId)
  })

  it("translates from English to Arabic when languages differ", async () => {
    vi.mocked(translate).mockResolvedValue("مرحبا")

    const result = await getText("hello", "en", "ar", schoolId)

    expect(result).toBe("مرحبا")
    expect(translate).toHaveBeenCalledWith("hello", "en", "ar", schoolId)
  })

  // --- Cross-language fallback ----------------------------------------------
  it("returns source text as fallback when translation fails", async () => {
    vi.mocked(translate).mockRejectedValue(new Error("API unavailable"))

    const result = await getText("مرحبا", "ar", "en", schoolId)

    expect(result).toBe("مرحبا")
  })

  it("returns source text on network error without rethrowing", async () => {
    // en->ar: "hello" has no Arabic script, so neither cross-lang guard fires
    // and translate() is reached — its rejection must fall back, not rethrow.
    vi.mocked(translate).mockRejectedValue(
      new Error("GOOGLE_TRANSLATE_API_KEY not configured")
    )

    const result = await getText("hello", "en", "ar", schoolId)

    expect(result).toBe("hello")
    expect(translate).toHaveBeenCalledWith("hello", "en", "ar", schoolId)
  })

  // --- NEW: cross-language script-mismatch guards ----------------------------
  it("skips translation when target is ar and text is already Arabic script", async () => {
    // contentLang flag claims "en" but the stored text is Arabic — displaying
    // in "ar" must return it verbatim without an API round-trip.
    const result = await getText("مرحبا", "en", "ar", schoolId)

    expect(result).toBe("مرحبا")
    expect(translate).not.toHaveBeenCalled()
  })

  it("skips translation when target is en and text is already pure Latin", async () => {
    // contentLang flag claims "ar" but the stored text is Latin — displaying
    // in "en" must return it verbatim without an API round-trip.
    const result = await getText("Mathematics", "ar", "en", schoolId)

    expect(result).toBe("Mathematics")
    expect(translate).not.toHaveBeenCalled()
  })

  // --- NEW: same-language (ar/ar) Latin-stored-as-Arabic correction ----------
  it("corrects Latin text wrongly stored as ar by translating from English", async () => {
    vi.mocked(translate).mockResolvedValue("الرياضيات")

    const result = await getText("Mathematics", "ar", "ar", schoolId)

    expect(result).toBe("الرياضيات")
    // Treated as English source despite the ar/ar same-lang call.
    expect(translate).toHaveBeenCalledWith("Mathematics", "en", "ar", schoolId)
  })

  it("falls back to raw Latin text when the ar/ar correction translate fails", async () => {
    vi.mocked(translate).mockRejectedValue(new Error("API down"))

    const result = await getText("Mathematics", "ar", "ar", schoolId)

    expect(result).toBe("Mathematics")
    expect(translate).toHaveBeenCalledWith("Mathematics", "en", "ar", schoolId)
  })
})

describe("getFields", () => {
  const schoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns fields directly when content and display language are the same", async () => {
    const entity = {
      title: "مرحبا",
      body: "هذا هو المحتوى",
      id: "1",
    }

    const result = await getFields(
      entity,
      ["title", "body"],
      "ar",
      "ar",
      schoolId
    )

    expect(result).toEqual({
      title: "مرحبا",
      body: "هذا هو المحتوى",
    })
    expect(translate).not.toHaveBeenCalled()
  })

  it("returns empty string for non-string fields when same language", async () => {
    const entity = {
      title: "مرحبا",
      count: 42,
      active: true,
    }

    const result = await getFields(
      entity,
      ["title", "count", "active"],
      "ar",
      "ar",
      schoolId
    )

    expect(result).toEqual({
      title: "مرحبا",
      count: "",
      active: "",
    })
  })

  it("translates all fields in parallel when languages differ", async () => {
    vi.mocked(translate)
      .mockResolvedValueOnce("hello")
      .mockResolvedValueOnce("This is the content")

    const entity = {
      title: "مرحبا",
      body: "هذا هو المحتوى",
    }

    const result = await getFields(
      entity,
      ["title", "body"],
      "ar",
      "en",
      schoolId
    )

    expect(result).toEqual({
      title: "hello",
      body: "This is the content",
    })
    expect(translate).toHaveBeenCalledTimes(2)
    expect(translate).toHaveBeenCalledWith("مرحبا", "ar", "en", schoolId)
    expect(translate).toHaveBeenCalledWith(
      "هذا هو المحتوى",
      "ar",
      "en",
      schoolId
    )
  })

  it("returns empty string for empty field values when translating", async () => {
    const entity = {
      title: "مرحبا",
      body: "",
      description: null as string | null,
    }

    vi.mocked(translate).mockResolvedValueOnce("hello")

    const result = await getFields(
      entity,
      ["title", "body"],
      "ar",
      "en",
      schoolId
    )

    expect(result.title).toBe("hello")
    expect(result.body).toBe("")
    // translate should only be called for non-empty "title"
    expect(translate).toHaveBeenCalledTimes(1)
  })

  it("falls back to source text when translation of a field fails", async () => {
    vi.mocked(translate)
      .mockResolvedValueOnce("hello") // title succeeds
      .mockRejectedValueOnce(new Error("API error")) // body fails

    const entity = {
      title: "مرحبا",
      body: "هذا هو المحتوى",
    }

    const result = await getFields(
      entity,
      ["title", "body"],
      "ar",
      "en",
      schoolId
    )

    expect(result).toEqual({
      title: "hello",
      body: "هذا هو المحتوى", // Fallback to source
    })
  })

  it("handles entity with missing fields gracefully", async () => {
    const entity = {
      title: "مرحبا",
      // "body" field does not exist on entity
    }

    const result = await getFields(
      entity,
      ["title", "body"],
      "ar",
      "ar",
      schoolId
    )

    expect(result).toEqual({
      title: "مرحبا",
      body: "",
    })
  })

  it("handles all translations failing by returning source texts", async () => {
    vi.mocked(translate)
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))

    const entity = {
      title: "مرحبا",
      body: "عالم",
    }

    const result = await getFields(
      entity,
      ["title", "body"],
      "ar",
      "en",
      schoolId
    )

    expect(result).toEqual({
      title: "مرحبا",
      body: "عالم",
    })
  })

  // --- NEW: per-field script-mismatch guard in one call ----------------------
  it("skips fields already in the display script and translates only the rest", async () => {
    // Display target is "en". "code" is already Latin (guarded, no API),
    // while "title" is Arabic and must be translated — both in a single call.
    vi.mocked(translate).mockResolvedValueOnce("Mathematics")

    const entity = {
      title: "الرياضيات",
      code: "MATH101",
    }

    const result = await getFields(
      entity,
      ["title", "code"],
      "ar",
      "en",
      schoolId
    )

    expect(result).toEqual({
      title: "Mathematics",
      code: "MATH101", // returned raw — already Latin
    })
    expect(translate).toHaveBeenCalledTimes(1)
    expect(translate).toHaveBeenCalledWith("الرياضيات", "ar", "en", schoolId)
  })
})
