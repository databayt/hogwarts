// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  hasIndexedDb,
  idbDelete,
  idbDeleteByIndex,
  idbGet,
  idbGetAll,
  idbGetAllByIndex,
  idbPut,
  STORES,
  type DownloadedLesson,
  type StoredAsset,
  type StoredChunk,
} from "./db"

/**
 * Downloads a lesson for offline study and keeps it in IndexedDB.
 *
 * The video comes down in Range-sized chunks against a signed URL the server
 * hands out per request (`/api/lumos/video/[id]/download`). Each chunk is its
 * own row, so a download interrupted at 40% resumes at 40% — on the next
 * tap, the next day, after a reload — instead of starting over on a metered
 * connection. When the last chunk lands the rows are assembled into one Blob
 * for playback and deleted.
 *
 * Documents (worksheets, notes) are small and fetched whole.
 */

export const CHUNK_BYTES = 8 * 1024 * 1024

/** Mirrors `OfflineLessonManifest` in the route; kept structural so the client bundle owns no server types. */
export interface LessonManifest {
  lesson: {
    id: string
    title: string
    description: string | null
    durationMinutes: number | null
    chapter: { id: string; title: string; position: number }
    course: { id: string; title: string; slug: string; objectives: string[] }
  }
  video:
    | {
        kind: "self-hosted"
        videoId: string
        ticket: string
        downloadable: boolean
        durationSeconds: number | null
        bytes: number | null
      }
    | { kind: "external"; url: string }
    | null
  documents: Array<{
    id: string
    kind: "material" | "attachment"
    title: string
    type: string | null
    ticket: string
  }>
  questions: Array<{
    id: string
    questionText: string
    questionType: string
    choices: string[] | null
  }>
  progress: {
    isCompleted: boolean
    watchedSeconds: number
    totalSeconds: number | null
  } | null
  generatedAt: string
}

export interface DownloadProgress {
  lessonId: string
  phase: "manifest" | "video" | "documents" | "done"
  receivedBytes: number
  totalBytes: number | null
}

export type DownloadFailure =
  | "offline"
  | "unsupported"
  | "manifest"
  | "not-downloadable"
  | "ticket"
  | "network"
  | "storage"
  | "cancelled"

export class DownloadError extends Error {
  constructor(
    public readonly reason: DownloadFailure,
    message?: string
  ) {
    super(message ?? reason)
    this.name = "DownloadError"
  }
}

export function videoAssetKey(lessonId: string): string {
  return `${lessonId}:video`
}

export function docAssetKey(lessonId: string, docId: string): string {
  return `${lessonId}:doc:${docId}`
}

/**
 * `Content-Range: bytes 0-8388607/123456789` → `{ start, end, total }`.
 * `total` is null for the `*` form. Pure, for the tests.
 */
export function parseContentRange(
  header: string | null
): { start: number; end: number; total: number | null } | null {
  if (!header) return null
  const m = /^bytes (\d+)-(\d+)\/(\d+|\*)$/.exec(header.trim())
  if (!m) return null
  return {
    start: Number(m[1]),
    end: Number(m[2]),
    total: m[3] === "*" ? null : Number(m[3]),
  }
}

/** The next Range to ask for, or null when everything is here. Pure. */
export function nextRange(
  receivedBytes: number,
  totalBytes: number | null,
  chunkBytes = CHUNK_BYTES
): { start: number; end: number } | null {
  if (totalBytes !== null && receivedBytes >= totalBytes) return null
  const start = receivedBytes
  const end =
    totalBytes === null
      ? start + chunkBytes - 1
      : Math.min(start + chunkBytes - 1, totalBytes - 1)
  return { start, end }
}

async function fetchTicket(
  ticketPath: string,
  signal?: AbortSignal
): Promise<{
  url: string
  bytes?: number | null
  contentType?: string | null
  filename?: string
}> {
  const res = await fetch(ticketPath, { credentials: "same-origin", signal })
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}))
    throw new DownloadError(
      body?.code === "DOWNLOAD_NOT_ALLOWED" ? "not-downloadable" : "ticket",
      body?.error
    )
  }
  if (!res.ok) throw new DownloadError("ticket", `ticket ${res.status}`)
  return res.json()
}

export async function getDownloadedLesson(
  lessonId: string
): Promise<DownloadedLesson | undefined> {
  if (!hasIndexedDb()) return undefined
  return idbGet<DownloadedLesson>(STORES.lessons, lessonId)
}

export async function listDownloadedLessons(): Promise<DownloadedLesson[]> {
  if (!hasIndexedDb()) return []
  const all = await idbGetAll<DownloadedLesson>(STORES.lessons)
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getStoredAsset(
  key: string
): Promise<StoredAsset | undefined> {
  if (!hasIndexedDb()) return undefined
  return idbGet<StoredAsset>(STORES.assets, key)
}

/** Everything about a lesson: its row, its assets, its in-flight chunks. */
export async function removeDownloadedLesson(lessonId: string): Promise<void> {
  if (!hasIndexedDb()) return
  const assets = await idbGetAllByIndex<StoredAsset>(
    STORES.assets,
    "lessonId",
    lessonId
  )
  for (const a of assets) {
    await idbDeleteByIndex(STORES.chunks, "key", a.key)
    await idbDelete(STORES.assets, a.key)
  }
  await idbDelete(STORES.lessons, lessonId)
}

/**
 * Download (or resume) a lesson. Resolves with the stored row; throws a
 * `DownloadError` naming what went wrong. Progress is reported per chunk.
 */
export async function downloadLesson(
  lessonId: string,
  opts: {
    onProgress?: (p: DownloadProgress) => void
    signal?: AbortSignal
  } = {}
): Promise<DownloadedLesson> {
  if (!hasIndexedDb()) throw new DownloadError("unsupported")
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new DownloadError("offline")
  }
  const { onProgress, signal } = opts
  const report = (p: Omit<DownloadProgress, "lessonId">) =>
    onProgress?.({ lessonId, ...p })

  report({ phase: "manifest", receivedBytes: 0, totalBytes: null })
  const manifestRes = await fetch(`/api/offline/lesson/${lessonId}`, {
    credentials: "same-origin",
    signal,
  })
  if (!manifestRes.ok)
    throw new DownloadError("manifest", `manifest ${manifestRes.status}`)
  const manifest = (await manifestRes.json()) as LessonManifest

  const existing = await getDownloadedLesson(lessonId)
  const now = new Date().toISOString()
  let row: DownloadedLesson = {
    id: lessonId,
    manifest,
    status: "partial",
    bytes: existing?.bytes ?? 0,
    savedAt: existing?.savedAt ?? now,
    updatedAt: now,
  }
  await idbPut(STORES.lessons, row)

  try {
    if (manifest.video?.kind === "self-hosted") {
      if (!manifest.video.downloadable)
        throw new DownloadError("not-downloadable")
      await downloadVideo(lessonId, manifest.video, report, signal)
    }

    report({ phase: "documents", receivedBytes: 0, totalBytes: null })
    for (const doc of manifest.documents) {
      await downloadDocument(lessonId, doc, signal)
    }

    const assets = await idbGetAllByIndex<StoredAsset>(
      STORES.assets,
      "lessonId",
      lessonId
    )
    row = {
      ...row,
      status: "complete",
      bytes: assets.reduce((n, a) => n + a.receivedBytes, 0),
      updatedAt: new Date().toISOString(),
      error: undefined,
    }
    await idbPut(STORES.lessons, row)
    report({ phase: "done", receivedBytes: row.bytes, totalBytes: row.bytes })
    return row
  } catch (err) {
    const reason =
      err instanceof DownloadError
        ? err.reason
        : (err as { name?: string })?.name === "AbortError"
          ? "cancelled"
          : isQuotaError(err)
            ? "storage"
            : "network"
    const assets = await idbGetAllByIndex<StoredAsset>(
      STORES.assets,
      "lessonId",
      lessonId
    )
    await idbPut(STORES.lessons, {
      ...row,
      // A cancel keeps what landed so the next tap resumes; the row stays partial.
      status: reason === "cancelled" ? "partial" : "failed",
      bytes: assets.reduce((n, a) => n + a.receivedBytes, 0),
      updatedAt: new Date().toISOString(),
      error: reason,
    })
    throw err instanceof DownloadError
      ? err
      : new DownloadError(reason, String(err))
  }
}

function isQuotaError(err: unknown): boolean {
  const name = (err as { name?: string })?.name
  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED"
}

async function downloadVideo(
  lessonId: string,
  video: Extract<NonNullable<LessonManifest["video"]>, { kind: "self-hosted" }>,
  report: (p: Omit<DownloadProgress, "lessonId">) => void,
  signal?: AbortSignal
): Promise<void> {
  const key = videoAssetKey(lessonId)
  const stored = await idbGet<StoredAsset>(STORES.assets, key)
  if (stored?.complete && stored.blob) {
    report({
      phase: "video",
      receivedBytes: stored.receivedBytes,
      totalBytes: stored.totalBytes,
    })
    return
  }

  let asset: StoredAsset = stored ?? {
    key,
    lessonId,
    kind: "video",
    name: "video",
    contentType: "video/mp4",
    totalBytes: video.bytes,
    receivedBytes: 0,
    complete: false,
  }
  // Chunks already on disk decide where we resume, not the asset row — the
  // row is written after the chunk, so a crash between the two leaves one
  // extra chunk, never a hole.
  const chunks = await idbGetAllByIndex<StoredChunk>(STORES.chunks, "key", key)
  chunks.sort((a, b) => a.index - b.index)
  let received = chunks.reduce((n, c) => n + c.blob.size, 0)
  let index = chunks.length
  asset = { ...asset, receivedBytes: received }
  await idbPut(STORES.assets, asset)
  report({
    phase: "video",
    receivedBytes: received,
    totalBytes: asset.totalBytes,
  })

  let ticket = await fetchTicket(video.ticket, signal)
  if (ticket.contentType) asset.contentType = ticket.contentType
  if (ticket.filename) asset.name = ticket.filename
  if (typeof ticket.bytes === "number") asset.totalBytes = ticket.bytes

  let refreshed = false
  for (;;) {
    const range = nextRange(received, asset.totalBytes)
    if (!range) break

    const res = await fetch(ticket.url, {
      headers: { Range: `bytes=${range.start}-${range.end}` },
      signal,
      mode: "cors",
      credentials: "omit",
    })

    if (res.status === 403 && !refreshed) {
      // Signed URL expired mid-download (a two-hour ticket on a slow link).
      refreshed = true
      ticket = await fetchTicket(video.ticket, signal)
      continue
    }
    if (res.status === 416) break // nothing past `received` — we are done
    if (res.status !== 206 && res.status !== 200) {
      throw new DownloadError("network", `chunk ${res.status}`)
    }

    const blob = await res.blob()
    if (res.status === 200) {
      // The origin ignored Range and sent everything: take it as the whole file.
      await idbDeleteByIndex(STORES.chunks, "key", key)
      await idbPut<StoredChunk>(STORES.chunks, { key, index: 0, blob })
      received = blob.size
      asset.totalBytes = blob.size
      index = 1
    } else {
      const cr = parseContentRange(res.headers.get("content-range"))
      if (cr?.total !== null && cr?.total !== undefined)
        asset.totalBytes = cr.total
      // A body shorter than the range it claims is a truncated chunk (a proxy
      // cut it, a captive portal answered) — storing it would corrupt the
      // file at a boundary no later check could find.
      if (cr && blob.size !== cr.end - cr.start + 1) {
        throw new DownloadError("network", "short chunk")
      }
      await idbPut<StoredChunk>(STORES.chunks, { key, index, blob })
      index++
      received += blob.size
      refreshed = false
    }
    asset = { ...asset, receivedBytes: received }
    await idbPut(STORES.assets, asset)
    report({
      phase: "video",
      receivedBytes: received,
      totalBytes: asset.totalBytes,
    })

    if (blob.size === 0) break
  }

  // Assemble: one Blob for the <video>, chunk rows gone.
  const all = await idbGetAllByIndex<StoredChunk>(STORES.chunks, "key", key)
  all.sort((a, b) => a.index - b.index)
  const whole = new Blob(
    all.map((c) => c.blob),
    { type: asset.contentType }
  )
  await idbPut<StoredAsset>(STORES.assets, {
    ...asset,
    receivedBytes: whole.size,
    totalBytes: whole.size,
    complete: true,
    blob: whole,
  })
  await idbDeleteByIndex(STORES.chunks, "key", key)
  report({ phase: "video", receivedBytes: whole.size, totalBytes: whole.size })
}

async function downloadDocument(
  lessonId: string,
  doc: LessonManifest["documents"][number],
  signal?: AbortSignal
): Promise<void> {
  const key = docAssetKey(lessonId, doc.id)
  const stored = await idbGet<StoredAsset>(STORES.assets, key)
  if (stored?.complete && stored.blob) return

  const ticket = await fetchTicket(doc.ticket, signal)
  const res = await fetch(ticket.url, {
    signal,
    mode: "cors",
    credentials: "omit",
  })
  if (!res.ok) throw new DownloadError("network", `document ${res.status}`)
  const blob = await res.blob()
  await idbPut<StoredAsset>(STORES.assets, {
    key,
    lessonId,
    kind: "doc",
    name: ticket.filename ?? doc.title,
    contentType: ticket.contentType ?? blob.type ?? "application/octet-stream",
    totalBytes: blob.size,
    receivedBytes: blob.size,
    complete: true,
    blob,
  })
}
