// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { extractFirstUrl } from "@/components/school-dashboard/messaging/link-preview"
import { unfurlUrl } from "@/components/school-dashboard/messaging/og-unfurl"

describe("extractFirstUrl", () => {
  it("extracts a simple URL from text", () => {
    expect(extractFirstUrl("Check out https://example.com for more info")).toBe(
      "https://example.com"
    )
  })

  it("extracts URL with path and query params", () => {
    expect(
      extractFirstUrl("See https://example.com/page?q=hello&lang=en today")
    ).toBe("https://example.com/page?q=hello&lang=en")
  })

  it("returns the first URL when multiple exist", () => {
    expect(
      extractFirstUrl("Visit https://first.com and https://second.com for more")
    ).toBe("https://first.com")
  })

  it("returns null when no URL is present", () => {
    expect(extractFirstUrl("Hello, this is just text")).toBeNull()
  })

  it("handles URL at the start of text", () => {
    expect(extractFirstUrl("https://example.com is a good site")).toBe(
      "https://example.com"
    )
  })

  it("handles URL at the end of text", () => {
    expect(extractFirstUrl("Go to https://example.com")).toBe(
      "https://example.com"
    )
  })

  it("handles http (not just https)", () => {
    expect(extractFirstUrl("Visit http://example.com")).toBe(
      "http://example.com"
    )
  })

  it("handles URL-only messages", () => {
    expect(extractFirstUrl("https://example.com/path")).toBe(
      "https://example.com/path"
    )
  })

  it("handles empty string", () => {
    expect(extractFirstUrl("")).toBeNull()
  })
})

describe("unfurlUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns null for non-HTML responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"data": true}', {
        headers: { "content-type": "application/json" },
      })
    )
    const result = await unfurlUrl("https://api.example.com/data")
    expect(result).toBeNull()
  })

  it("returns null for non-200 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404 })
    )
    const result = await unfurlUrl("https://example.com/missing")
    expect(result).toBeNull()
  })

  it("returns null on fetch error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"))
    const result = await unfurlUrl("https://unreachable.example.com")
    expect(result).toBeNull()
  })

  it("extracts og:title, og:description, og:image, og:site_name", async () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Test Page" />
        <meta property="og:description" content="A test description" />
        <meta property="og:image" content="https://example.com/image.jpg" />
        <meta property="og:site_name" content="Example" />
      </head><body></body></html>
    `
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, {
        headers: { "content-type": "text/html" },
      })
    )

    const result = await unfurlUrl("https://example.com/page")
    expect(result).toEqual({
      url: "https://example.com/page",
      title: "Test Page",
      description: "A test description",
      image: "https://example.com/image.jpg",
      siteName: "Example",
    })
  })

  it("falls back to twitter:title when og:title is missing", async () => {
    const html = `
      <html><head>
        <meta name="twitter:title" content="Twitter Title" />
        <meta name="twitter:description" content="Twitter desc" />
      </head><body></body></html>
    `
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, {
        headers: { "content-type": "text/html" },
      })
    )

    const result = await unfurlUrl("https://example.com")
    expect(result?.title).toBe("Twitter Title")
    expect(result?.description).toBe("Twitter desc")
  })

  it("falls back to <title> tag when OG tags missing", async () => {
    const html = `
      <html><head>
        <title>Page Title</title>
        <meta name="description" content="Meta desc" />
      </head><body></body></html>
    `
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, {
        headers: { "content-type": "text/html" },
      })
    )

    const result = await unfurlUrl("https://example.com")
    expect(result?.title).toBe("Page Title")
    expect(result?.description).toBe("Meta desc")
  })

  it("returns null when page has no meaningful metadata", async () => {
    const html = `<html><head></head><body>Empty</body></html>`
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, {
        headers: { "content-type": "text/html" },
      })
    )

    const result = await unfurlUrl("https://example.com")
    expect(result).toBeNull()
  })

  it("resolves relative image URLs", async () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Test" />
        <meta property="og:image" content="/images/hero.jpg" />
      </head><body></body></html>
    `
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, {
        headers: { "content-type": "text/html" },
      })
    )

    const result = await unfurlUrl("https://example.com/page")
    expect(result?.image).toBe("https://example.com/images/hero.jpg")
  })

  it("truncates long title and description", async () => {
    const longTitle = "A".repeat(300)
    const longDesc = "B".repeat(500)
    const html = `
      <html><head>
        <meta property="og:title" content="${longTitle}" />
        <meta property="og:description" content="${longDesc}" />
      </head><body></body></html>
    `
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, {
        headers: { "content-type": "text/html" },
      })
    )

    const result = await unfurlUrl("https://example.com")
    expect(result?.title?.length).toBeLessThanOrEqual(200)
    expect(result?.description?.length).toBeLessThanOrEqual(300)
  })
})
