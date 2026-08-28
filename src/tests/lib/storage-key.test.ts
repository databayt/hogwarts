// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { extractStorageKey, isOwnStorageUrl } from "@/lib/storage-key"

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.AWS_S3_BUCKET = "hogwarts-databayt"
  process.env.AWS_REGION = "us-east-1"
  delete process.env.CLOUDFRONT_DOMAIN
  delete process.env.CLOUDFRONT_ORIGIN_BUCKET
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe("extractStorageKey", () => {
  it("reads a virtual-hosted S3 URL for our bucket", () => {
    expect(
      extractStorageKey(
        "https://hogwarts-databayt.s3.us-east-1.amazonaws.com/stream/s1/video/a.mp4"
      )
    ).toBe("stream/s1/video/a.mp4")
  })

  it("decodes percent-encoded keys", () => {
    expect(
      extractStorageKey(
        "https://hogwarts-databayt.s3.us-east-1.amazonaws.com/stream/s1/video/my%20lesson.mp4"
      )
    ).toBe("stream/s1/video/my lesson.mp4")
  })

  it("reads a path-style S3 URL for our bucket", () => {
    expect(
      extractStorageKey(
        "https://s3.us-east-1.amazonaws.com/hogwarts-databayt/stream/s1/a.mp4"
      )
    ).toBe("stream/s1/a.mp4")
  })

  it("refuses another account's bucket", () => {
    // Signing a key we don't own would either fail or, worse, sign the wrong
    // object in our own bucket.
    expect(
      extractStorageKey(
        "https://someone-else.s3.us-east-1.amazonaws.com/stream/s1/a.mp4"
      )
    ).toBeNull()
  })

  it("refuses external players", () => {
    expect(extractStorageKey("https://www.youtube.com/watch?v=abc")).toBeNull()
    expect(extractStorageKey("https://vimeo.com/123")).toBeNull()
  })

  it("treats a bare path as a key already", () => {
    expect(extractStorageKey("stream/s1/video/a.mp4")).toBe(
      "stream/s1/video/a.mp4"
    )
    expect(extractStorageKey("/stream/s1/video/a.mp4")).toBe(
      "stream/s1/video/a.mp4"
    )
  })

  it("returns null for junk", () => {
    expect(extractStorageKey("")).toBeNull()
    expect(extractStorageKey("https://")).toBeNull()
  })

  describe("CloudFront", () => {
    it("ignores a distribution that does not front our bucket", () => {
      // cdn.databayt.org serves `databayt-cdn`, not the upload bucket — the
      // exact mismatch that made every rewritten video URL 403.
      process.env.CLOUDFRONT_DOMAIN = "cdn.databayt.org"
      expect(
        extractStorageKey("https://cdn.databayt.org/stream/s1/a.mp4")
      ).toBeNull()
    })

    it("reads it once the distribution is declared to front our bucket", () => {
      process.env.CLOUDFRONT_DOMAIN = "cdn.databayt.org"
      process.env.CLOUDFRONT_ORIGIN_BUCKET = "hogwarts-databayt"
      expect(
        extractStorageKey("https://cdn.databayt.org/stream/s1/a.mp4")
      ).toBe("stream/s1/a.mp4")
    })
  })
})

describe("isOwnStorageUrl", () => {
  it("is true only for objects we can sign", () => {
    expect(
      isOwnStorageUrl(
        "https://hogwarts-databayt.s3.us-east-1.amazonaws.com/stream/a.mp4"
      )
    ).toBe(true)
    expect(isOwnStorageUrl("https://www.youtube.com/watch?v=abc")).toBe(false)
    expect(isOwnStorageUrl("https://example.com/notes.pdf")).toBe(false)
    expect(isOwnStorageUrl(null)).toBe(false)
    expect(isOwnStorageUrl(undefined)).toBe(false)
  })

  it("is false for a bare key — only absolute URLs are storage URLs", () => {
    expect(isOwnStorageUrl("stream/s1/a.mp4")).toBe(false)
  })
})
