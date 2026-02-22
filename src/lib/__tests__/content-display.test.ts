import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDisplayFields, getDisplayText } from "@/lib/content-display"
import { translateWithCache } from "@/lib/translate"

vi.mock("@/lib/translate", () => ({
  translateWithCache: vi.fn(),
}))

describe("getDisplayText", () => {
  const schoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns empty string for null text", async () => {
    const result = await getDisplayText(null, "ar", "en", schoolId)
    expect(result).toBe("")
    expect(translateWithCache).not.toHaveBeenCalled()
  })

  it("returns empty string for undefined text", async () => {
    const result = await getDisplayText(undefined, "ar", "en", schoolId)
    expect(result).toBe("")
    expect(translateWithCache).not.toHaveBeenCalled()
  })

  it("returns empty string for empty string text", async () => {
    const result = await getDisplayText("", "ar", "en", schoolId)
    expect(result).toBe("")
    expect(translateWithCache).not.toHaveBeenCalled()
  })

  it("returns empty string for whitespace-only text", async () => {
    const result = await getDisplayText("   ", "ar", "en", schoolId)
    expect(result).toBe("")
    expect(translateWithCache).not.toHaveBeenCalled()
  })

  it("returns text directly when content and display language are the same", async () => {
    const result = await getDisplayText("مرحبا", "ar", "ar", schoolId)
    expect(result).toBe("مرحبا")
    expect(translateWithCache).not.toHaveBeenCalled()
  })

  it("returns text directly for same language (English)", async () => {
    const result = await getDisplayText("hello", "en", "en", schoolId)
    expect(result).toBe("hello")
    expect(translateWithCache).not.toHaveBeenCalled()
  })

  it("calls translateWithCache when languages differ", async () => {
    vi.mocked(translateWithCache).mockResolvedValue("hello")

    const result = await getDisplayText("مرحبا", "ar", "en", schoolId)

    expect(result).toBe("hello")
    expect(translateWithCache).toHaveBeenCalledWith(
      "مرحبا",
      "ar",
      "en",
      schoolId
    )
  })

  it("translates from English to Arabic when languages differ", async () => {
    vi.mocked(translateWithCache).mockResolvedValue("مرحبا")

    const result = await getDisplayText("hello", "en", "ar", schoolId)

    expect(result).toBe("مرحبا")
    expect(translateWithCache).toHaveBeenCalledWith(
      "hello",
      "en",
      "ar",
      schoolId
    )
  })

  it("returns source text as fallback when translation fails", async () => {
    vi.mocked(translateWithCache).mockRejectedValue(
      new Error("API unavailable")
    )

    const result = await getDisplayText("مرحبا", "ar", "en", schoolId)

    expect(result).toBe("مرحبا")
  })

  it("returns source text on network error without rethrowing", async () => {
    vi.mocked(translateWithCache).mockRejectedValue(
      new Error("GOOGLE_TRANSLATE_API_KEY not configured")
    )

    const result = await getDisplayText("hello", "en", "ar", schoolId)

    expect(result).toBe("hello")
  })
})

describe("getDisplayFields", () => {
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

    const result = await getDisplayFields(
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
    expect(translateWithCache).not.toHaveBeenCalled()
  })

  it("returns empty string for non-string fields when same language", async () => {
    const entity = {
      title: "مرحبا",
      count: 42,
      active: true,
    }

    const result = await getDisplayFields(
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
    vi.mocked(translateWithCache)
      .mockResolvedValueOnce("hello")
      .mockResolvedValueOnce("This is the content")

    const entity = {
      title: "مرحبا",
      body: "هذا هو المحتوى",
    }

    const result = await getDisplayFields(
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
    expect(translateWithCache).toHaveBeenCalledTimes(2)
    expect(translateWithCache).toHaveBeenCalledWith(
      "مرحبا",
      "ar",
      "en",
      schoolId
    )
    expect(translateWithCache).toHaveBeenCalledWith(
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

    vi.mocked(translateWithCache).mockResolvedValueOnce("hello")

    const result = await getDisplayFields(
      entity,
      ["title", "body"],
      "ar",
      "en",
      schoolId
    )

    expect(result.title).toBe("hello")
    expect(result.body).toBe("")
    // translateWithCache should only be called for non-empty "title"
    expect(translateWithCache).toHaveBeenCalledTimes(1)
  })

  it("falls back to source text when translation of a field fails", async () => {
    vi.mocked(translateWithCache)
      .mockResolvedValueOnce("hello") // title succeeds
      .mockRejectedValueOnce(new Error("API error")) // body fails

    const entity = {
      title: "مرحبا",
      body: "هذا هو المحتوى",
    }

    const result = await getDisplayFields(
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

    const result = await getDisplayFields(
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
    vi.mocked(translateWithCache)
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))

    const entity = {
      title: "مرحبا",
      body: "عالم",
    }

    const result = await getDisplayFields(
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
})
