// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The resume math, and a full download against an in-memory IndexedDB with a
 * fetch that serves Range requests — including the interruption-then-resume
 * path that is the whole point of chunking.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  CHUNK_BYTES,
  DownloadError,
  downloadLesson,
  getStoredAsset,
  nextRange,
  parseContentRange,
  videoAssetKey,
} from "@/lib/offline/download-manager"

type Row = Record<string, unknown> & {
  key?: string
  id?: string
  index?: number
}
const stores: Record<string, Map<string, Row>> = {
  lessons: new Map(),
  assets: new Map(),
  chunks: new Map(),
  outbox: new Map(),
}
const keyOf = (store: string, v: Row) =>
  store === "chunks" ? `${v.key}#${v.index}` : String(v.key ?? v.id)

vi.mock("@/lib/offline/db", () => ({
  STORES: {
    lessons: "lessons",
    assets: "assets",
    chunks: "chunks",
    outbox: "outbox",
  },
  hasIndexedDb: () => true,
  idbGet: async (s: string, key: string) => stores[s].get(key),
  idbGetAll: async (s: string) => [...stores[s].values()],
  idbGetAllByIndex: async (s: string, index: string, value: string) =>
    [...stores[s].values()].filter((r) => r[index] === value),
  idbPut: async (s: string, v: Row) => {
    stores[s].set(keyOf(s, v), v)
  },
  idbDelete: async (s: string, key: string) => {
    stores[s].delete(key)
  },
  idbDeleteByIndex: async (s: string, index: string, value: string) => {
    for (const [k, r] of stores[s]) if (r[index] === value) stores[s].delete(k)
  },
}))

describe("parseContentRange", () => {
  it("reads start/end/total and the unknown-total form", () => {
    expect(parseContentRange("bytes 0-8388607/123456789")).toEqual({
      start: 0,
      end: 8388607,
      total: 123456789,
    })
    expect(parseContentRange("bytes 10-19/*")).toEqual({
      start: 10,
      end: 19,
      total: null,
    })
    expect(parseContentRange(null)).toBeNull()
    expect(parseContentRange("garbage")).toBeNull()
  })
})

describe("nextRange", () => {
  it("asks for the next chunk from what is already on disk, clamped to the file", () => {
    expect(nextRange(0, 100, 30)).toEqual({ start: 0, end: 29 })
    expect(nextRange(30, 100, 30)).toEqual({ start: 30, end: 59 })
    expect(nextRange(90, 100, 30)).toEqual({ start: 90, end: 99 })
    expect(nextRange(100, 100, 30)).toBeNull()
  })

  it("keeps asking in chunk-sized steps when the total is unknown", () => {
    expect(nextRange(0, null, 30)).toEqual({ start: 0, end: 29 })
    expect(nextRange(60, null)).toEqual({
      start: 60,
      end: 60 + CHUNK_BYTES - 1,
    })
  })
})

// ---------------------------------------------------------------------------
// End to end against a Range-serving fetch
// ---------------------------------------------------------------------------

const FILE = new Uint8Array(20_000_000).map((_, i) => i % 251) // ~19 MB → 3 chunks
const MANIFEST = {
  lesson: {
    id: "l1",
    title: "Fractions",
    description: null,
    durationMinutes: 10,
    chapter: { id: "c1", title: "Ch 1", position: 1 },
    course: { id: "s1", title: "Math", slug: "math", objectives: [] },
  },
  video: {
    kind: "self-hosted",
    videoId: "v1",
    ticket: "/api/lumos/video/v1/download",
    downloadable: true,
    durationSeconds: 600,
    bytes: FILE.byteLength,
  },
  documents: [
    {
      id: "d1",
      kind: "material",
      title: "Worksheet",
      type: "PDF",
      ticket: "/api/lumos/file/material/d1?ticket=1",
    },
  ],
  questions: [],
  progress: null,
  generatedAt: "2026-08-29T00:00:00.000Z",
}

let failAfterChunks = Infinity
let rangeRequests: string[] = []

function fakeFetch(url: string, init?: RequestInit): Promise<Response> {
  if (url.startsWith("/api/offline/lesson/")) {
    return Promise.resolve(
      new Response(JSON.stringify(MANIFEST), { status: 200 })
    )
  }
  if (url === "/api/lumos/video/v1/download") {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          url: "https://s3.test/v1.mp4",
          bytes: FILE.byteLength,
          contentType: "video/mp4",
          filename: "Fractions.mp4",
        }),
        { status: 200 }
      )
    )
  }
  if (url.startsWith("/api/lumos/file/material/d1")) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          url: "https://s3.test/d1.pdf",
          filename: "Worksheet.pdf",
          contentType: "application/pdf",
        }),
        { status: 200 }
      )
    )
  }
  if (url === "https://s3.test/d1.pdf") {
    return Promise.resolve(new Response(new Uint8Array(1234), { status: 200 }))
  }
  if (url === "https://s3.test/v1.mp4") {
    const range = (init?.headers as Record<string, string>)?.Range
    rangeRequests.push(range)
    if (rangeRequests.length > failAfterChunks) {
      return Promise.reject(new TypeError("network down"))
    }
    const m = /^bytes=(\d+)-(\d+)$/.exec(range)!
    const start = Number(m[1])
    const end = Math.min(Number(m[2]), FILE.byteLength - 1)
    if (start >= FILE.byteLength)
      return Promise.resolve(new Response(null, { status: 416 }))
    return Promise.resolve(
      new Response(FILE.slice(start, end + 1), {
        status: 206,
        headers: {
          "content-range": `bytes ${start}-${end}/${FILE.byteLength}`,
        },
      })
    )
  }
  return Promise.resolve(new Response("nope", { status: 404 }))
}

beforeEach(() => {
  for (const s of Object.values(stores)) s.clear()
  failAfterChunks = Infinity
  rangeRequests = []
  vi.stubGlobal("fetch", vi.fn(fakeFetch))
  vi.stubGlobal("navigator", { onLine: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("downloadLesson", () => {
  it("fetches the video in chunks, assembles one Blob, and stores the documents", async () => {
    const progress: number[] = []
    const row = await downloadLesson("l1", {
      onProgress: (p) => progress.push(p.receivedBytes),
    })
    expect(row.status).toBe("complete")
    expect(rangeRequests).toEqual([
      `bytes=0-${CHUNK_BYTES - 1}`,
      `bytes=${CHUNK_BYTES}-${2 * CHUNK_BYTES - 1}`,
      `bytes=${2 * CHUNK_BYTES}-${FILE.byteLength - 1}`,
    ])
    const video = await getStoredAsset(videoAssetKey("l1"))
    expect(video?.complete).toBe(true)
    expect(video?.blob?.size).toBe(FILE.byteLength)
    expect(video?.contentType).toBe("video/mp4")
    expect(stores.chunks.size).toBe(0) // assembled and cleaned up
    const doc = await getStoredAsset("l1:doc:d1")
    expect(doc?.complete).toBe(true)
    expect(doc?.blob?.size).toBe(1234)
    expect(row.bytes).toBe(FILE.byteLength + 1234)
    expect(progress.at(-1)).toBe(row.bytes)
  })

  it("resumes after an interruption from the last stored chunk, never from zero", async () => {
    failAfterChunks = 1
    await expect(downloadLesson("l1")).rejects.toBeInstanceOf(DownloadError)
    expect(stores.lessons.get("l1")?.status).toBe("failed")
    expect(stores.chunks.size).toBe(1)

    failAfterChunks = Infinity
    rangeRequests = []
    const row = await downloadLesson("l1")
    expect(row.status).toBe("complete")
    // second run started at chunk 2 — the first chunk was never re-fetched
    expect(rangeRequests[0]).toBe(`bytes=${CHUNK_BYTES}-${2 * CHUNK_BYTES - 1}`)
    const video = await getStoredAsset(videoAssetKey("l1"))
    expect(video?.blob?.size).toBe(FILE.byteLength)
  })

  it("names 'not-downloadable' when the owner has not allowed it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) =>
        url === "/api/lumos/video/v1/download"
          ? Promise.resolve(
              new Response(
                JSON.stringify({
                  error: "Download not permitted",
                  code: "DOWNLOAD_NOT_ALLOWED",
                }),
                { status: 403 }
              )
            )
          : fakeFetch(url, init)
      )
    )
    await expect(downloadLesson("l1")).rejects.toMatchObject({
      reason: "not-downloadable",
    })
    expect(stores.lessons.get("l1")?.error).toBe("not-downloadable")
  })

  it("refuses to start with no connection", async () => {
    vi.stubGlobal("navigator", { onLine: false })
    await expect(downloadLesson("l1")).rejects.toMatchObject({
      reason: "offline",
    })
  })
})
