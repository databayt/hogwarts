// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The device-side store for work done without a connection: the outbox.
 *
 * Only the outbox. Version 1 also held downloaded lessons and their media;
 * that was withdrawn by school policy (videos and materials are watched in
 * the app, never copied to a device), and the upgrade to version 2 drops
 * those stores — including any media a device downloaded in between.
 *
 * IndexedDB, no wrapper library: the surface we need is four verbs on one
 * store, and every dependency here ships to every student's phone.
 * Browser-only; every export guards `indexedDB`.
 */

export const OFFLINE_DB_NAME = "hogwarts-offline"
export const OFFLINE_DB_VERSION = 2

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

export const STORES = { outbox: "outbox" } as const

/** Stores from version 1 that policy retired; removed on upgrade. */
const RETIRED_STORES = ["lessons", "assets", "chunks"]

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
      for (const name of RETIRED_STORES) {
        if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name)
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
