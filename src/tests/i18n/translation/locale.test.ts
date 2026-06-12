// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDisplayLang } from "@/components/translation/locale"

const { headers, cookies } = vi.hoisted(() => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}))

vi.mock("next/headers", () => ({ headers, cookies }))

// React's cache() memoizes per request store; in tests there is no request, so
// make it an identity wrapper to assert the resolution logic itself.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>()
  return { ...actual, cache: <T>(fn: T) => fn }
})

const headerMap = (entries: Record<string, string>) => ({
  get: (k: string) => entries[k] ?? null,
})
const cookieMap = (entries: Record<string, string>) => ({
  get: (k: string) => (entries[k] ? { value: entries[k] } : undefined),
})

beforeEach(() => {
  vi.clearAllMocks()
  headers.mockResolvedValue(headerMap({}))
  cookies.mockResolvedValue(cookieMap({}))
})

describe("getDisplayLang (ambient locale)", () => {
  it("prefers the x-locale header set by the proxy", async () => {
    headers.mockResolvedValue(headerMap({ "x-locale": "en" }))
    expect(await getDisplayLang()).toBe("en")
  })

  it("accepts ar from the header", async () => {
    headers.mockResolvedValue(headerMap({ "x-locale": "ar" }))
    expect(await getDisplayLang()).toBe("ar")
  })

  it("ignores garbage header values and falls through to the cookie", async () => {
    headers.mockResolvedValue(headerMap({ "x-locale": "fr" }))
    cookies.mockResolvedValue(cookieMap({ NEXT_LOCALE: "en" }))
    expect(await getDisplayLang()).toBe("en")
  })

  it("falls back to the NEXT_LOCALE cookie when no header", async () => {
    cookies.mockResolvedValue(cookieMap({ NEXT_LOCALE: "en" }))
    expect(await getDisplayLang()).toBe("en")
  })

  it("any non-en cookie value resolves to ar (Arabic-default platform)", async () => {
    cookies.mockResolvedValue(cookieMap({ NEXT_LOCALE: "de" }))
    expect(await getDisplayLang()).toBe("ar")
  })

  it("defaults to ar with neither header nor cookie", async () => {
    expect(await getDisplayLang()).toBe("ar")
  })

  it("defaults to ar when header access throws (non-request context)", async () => {
    headers.mockRejectedValue(new Error("outside request scope"))
    expect(await getDisplayLang()).toBe("ar")
  })
})
