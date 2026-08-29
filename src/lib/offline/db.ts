// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The device-side store for offline learning: downloaded lessons, their
 * media, and the outbox of work done without a connection.
 *
 * IndexedDB, not localStorage — a lesson video is hundreds of megabytes and
 * localStorage is a 5 MB string bag. No wrapper library: the surface we need
 * is four verbs on three stores, and every dependency here ships to every
 * student's phone.
 *
 * Browser-only. Every export guards `indexedDB` so an accidental server
 * import fails soft instead of throwing at module load.
 */

export const OFFLINE_DB_NAME = "hogwarts-offline"
export const OFFLINE_DB_VERSION = 1

export type DownloadedLessonStatus = "partial" | "complete" | "failed"

export interface DownloadedLesson {
  id: string
  /** The manifest as served by `GET /api/offline/lesson/[id]`. */
  manifest: unknown
  status: DownloadedLessonStatus
  /** Bytes on disk so far — the library shows what a lesson costs. */
  bytes: number
  savedAt: string
  updatedAt: string
  error?: string
}

/** One stored file. `key` is `${lessonId}:video` or `${lessonId}:doc:${docId}`. */
export interface StoredAsset {
  key: string
  lessonId: string
  kind: "video" | "doc"
  name: string
  contentType: string
  totalBytes: number | null
  receivedBytes: number
  complete: boolean
  /** Present once every chunk has landed and been assembled. */
  blob?: Blob
}

/** An in-flight download keeps its chunks as separate rows: appending to a growing Blob rewrites it. */
export interface StoredChunk {
  key: string
  index: number
  blob: Blob
}

export type OutboxKind = "progress" | "complete" | "quiz" | "assignment"

export interface OutboxItem {
  id: string
  kind: OutboxKind
  payload: unknown
  createdAt: string
  /** Lets a newer sample replace an older pending one (playback position). */
  coalesceKey?: string
  attempts: number
  /** Epoch ms before which the drainer leaves this item alone. */
  nextAt: number
  state: "pending" | "parked"
  lastError?: string
  /** The server's rejection code once parked. */
  code?: string
}

export const STORES = {
  lessons: "lessons",
  assets: "assets",
  chunks: "chunks",
  outbox: "outbox",
} as const

type StoreName = (typeof STORES)[keyof typeof STORES]

export function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined"
}

let dbPromise: Promise<IDBDatabase> | null = null

export function openOfflineDb(): Promise<IDBDatabase> {
  if (!hasIndexedDb()) {
    return Promise.reject(new Error("IndexedDB unavailable"))
  }
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORES.lessons)) {
        db.createObjectStore(STORES.lessons, { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains(STORES.assets)) {
        const assets = db.createObjectStore(STORES.assets, { keyPath: "key" })
        assets.createIndex("lessonId", "lessonId", { unique: false })
      }
      if (!db.objectStoreNames.contains(STORES.chunks)) {
        const chunks = db.createObjectStore(STORES.chunks, {
          keyPath: ["key", "index"],
        })
        chunks.createIndex("key", "key", { unique: false })
      }
      if (!db.objectStoreNames.contains(STORES.outbox)) {
        const outbox = db.createObjectStore(STORES.outbox, { keyPath: "id" })
        outbox.createIndex("state", "state", { unique: false })
        outbox.createIndex("coalesceKey", "coalesceKey", { unique: false })
      }
    }
    req.onsuccess = () => {
      const db = req.result
      // Another tab upgrading the schema closes us; reopen lazily next call.
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
    req.onerror = () => {
      dbPromise = null
      reject(req.error ?? new Error("IndexedDB open failed"))
    }
    req.onblocked = () => {
      dbPromise = null
      reject(new Error("IndexedDB open blocked"))
    }
  })
  return dbPromise
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () =>
      reject(req.error ?? new Error("IndexedDB request failed"))
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"))
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted"))
  })
}

export async function idbGet<T>(
  store: StoreName,
  key: IDBValidKey
): Promise<T | undefined> {
  const db = await openOfflineDb()
  return request(
    db.transaction(store, "readonly").objectStore(store).get(key)
  ) as Promise<T | undefined>
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await openOfflineDb()
  return request(
    db.transaction(store, "readonly").objectStore(store).getAll()
  ) as Promise<T[]>
}

export async function idbGetAllByIndex<T>(
  store: StoreName,
  index: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await openOfflineDb()
  return request(
    db
      .transaction(store, "readonly")
      .objectStore(store)
      .index(index)
      .getAll(value)
  ) as Promise<T[]>
}

export async function idbPut<T>(store: StoreName, value: T): Promise<void> {
  const db = await openOfflineDb()
  const tx = db.transaction(store, "readwrite")
  tx.objectStore(store).put(value)
  await done(tx)
}

export async function idbDelete(
  store: StoreName,
  key: IDBValidKey
): Promise<void> {
  const db = await openOfflineDb()
  const tx = db.transaction(store, "readwrite")
  tx.objectStore(store).delete(key)
  await done(tx)
}

/** Delete every row an index maps to `value` — a lesson's assets, an asset's chunks. */
export async function idbDeleteByIndex(
  store: StoreName,
  index: string,
  value: IDBValidKey
): Promise<void> {
  const db = await openOfflineDb()
  const tx = db.transaction(store, "readwrite")
  const keys = await request(
    tx.objectStore(store).index(index).getAllKeys(value)
  )
  for (const k of keys) tx.objectStore(store).delete(k)
  await done(tx)
}

/** Bytes used by everything stored, for the library's footer. */
export async function offlineStorageEstimate(): Promise<{
  usage: number | null
  quota: number | null
}> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return { usage: null, quota: null }
  }
  try {
    const e = await navigator.storage.estimate()
    return { usage: e.usage ?? null, quota: e.quota ?? null }
  } catch {
    return { usage: null, quota: null }
  }
}
