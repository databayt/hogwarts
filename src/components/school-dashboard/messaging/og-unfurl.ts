// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { LinkPreviewData } from "./link-preview"

/**
 * Fetch Open Graph metadata from a URL.
 * Runs server-side only. Timeout: 3 seconds to avoid blocking message send.
 */
export async function unfurlUrl(
  url: string
): Promise<LinkPreviewData | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Databayt/1.0; +https://databayt.org)",
        Accept: "text/html",
      },
      redirect: "follow",
    })

    clearTimeout(timeout)

    if (!response.ok) return null

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("text/html")) return null

    // Only read first 50KB to avoid large payloads
    const reader = response.body?.getReader()
    if (!reader) return null

    let html = ""
    const decoder = new TextDecoder()
    let bytesRead = 0
    const maxBytes = 50 * 1024

    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
      bytesRead += value.length
      // Stop early if we've found </head>
      if (html.includes("</head>")) break
    }
    reader.cancel()

    return parseOgTags(html, url)
  } catch {
    return null
  }
}

function parseOgTags(html: string, url: string): LinkPreviewData | null {
  const getMetaContent = (property: string): string | undefined => {
    // Match both property= and name= attributes
    const regex = new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    )
    const match = html.match(regex)
    return match?.[1] || match?.[2]
  }

  const getTitle = (): string | undefined => {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return titleMatch?.[1]?.trim()
  }

  const title = getMetaContent("og:title") || getMetaContent("twitter:title") || getTitle()
  const description =
    getMetaContent("og:description") ||
    getMetaContent("twitter:description") ||
    getMetaContent("description")
  const image = getMetaContent("og:image") || getMetaContent("twitter:image")
  const siteName = getMetaContent("og:site_name")

  if (!title && !description && !image) return null

  // Resolve relative image URLs
  let resolvedImage = image
  if (image && !image.startsWith("http")) {
    try {
      resolvedImage = new URL(image, url).href
    } catch {
      resolvedImage = undefined
    }
  }

  return {
    url,
    title: title?.substring(0, 200),
    description: description?.substring(0, 300),
    image: resolvedImage,
    siteName: siteName?.substring(0, 100),
  }
}
