// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { translate } from "@/components/translation/actions"
import { getFields, getText } from "@/components/translation/display"

vi.mock("@/components/translation/actions", () => ({
  translate: vi.fn(),
}))

describe("getText", () => {
  const schoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  it("returns source text as fallback when translation fails", async () => {
    vi.mocked(translate).mockRejectedValue(new Error("API unavailable"))

    const result = await getText("مرحبا", "ar", "en", schoolId)

    expect(result).toBe("مرحبا")
  })

  it("returns source text on network error without rethrowing", async () => {
    vi.mocked(translate).mockRejectedValue(
      new Error("GOOGLE_TRANSLATE_API_KEY not configured")
    )

    const result = await getText("hello", "en", "ar", schoolId)

    expect(result).toBe("hello")
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
})
