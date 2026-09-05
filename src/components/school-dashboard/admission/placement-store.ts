// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useSyncExternalStore } from "react"

import { getAvailableSectionsForPlacement } from "./actions"

/**
 * Module-level store for the ONE placement dialog — the Enrollment tab (PORTAL
 * admits, by application) and the students list (every channel, by student)
 * both open it from a row action.
 *
 * Why a store and not `useState` in the row cell: the listing tables remount
 * when a Server Action invoked from inside them completes — the section fetch
 * the dialog runs on open is one — and a local open flag was wiped before the
 * list arrived, so the dialog flashed and vanished. The credentials and
 * access-code dialogs hit the same trap and live in stores for the same
 * reason. The fetched sections live here too: a remounted effect re-reads
 * them instead of fetching again, which would loop (each completed fetch is
 * what remounts the table).
 */
export interface PlacementSection {
  id: string
  name: string
  enrolledStudents: number
  maxCapacity: number
}

export interface PlacementTarget {
  /** PORTAL path: place by the ADMITTED application. */
  applicationId?: string
  /** Any-channel path: place the Student directly. */
  studentId?: string
  name: string
  /** Exact grade — preferred for the section match. */
  gradeId?: string | null
  /** Free-text grade label (header + fallback match). */
  applyingForClass?: string | null
}

export interface PlacementStoreState {
  open: boolean
  target: PlacementTarget | null
  sections: PlacementSection[]
  isLoading: boolean
  loaded: boolean
}

const initialStore: PlacementStoreState = {
  open: false,
  target: null,
  sections: [],
  isLoading: false,
  loaded: false,
}

let storeState: PlacementStoreState = initialStore
const storeListeners = new Set<() => void>()
/** Key of the in-flight section fetch — a remount cannot start a second. */
let inflightKey: string | null = null

const targetKey = (t: PlacementTarget) =>
  t.studentId ? `s:${t.studentId}` : `a:${t.applicationId ?? ""}`

function notifyStore() {
  storeListeners.forEach((l) => l())
}

function setStore(patch: Partial<PlacementStoreState>) {
  storeState = { ...storeState, ...patch }
  notifyStore()
}

function getStore(): PlacementStoreState {
  return storeState
}

function subscribeStore(cb: () => void) {
  storeListeners.add(cb)
  return () => {
    storeListeners.delete(cb)
  }
}

function getStoreServerSnapshot(): PlacementStoreState {
  return initialStore
}

export function openPlacementDialog(target: PlacementTarget) {
  inflightKey = null
  setStore({
    open: true,
    target,
    sections: [],
    isLoading: false,
    loaded: false,
  })
}

export function closePlacementDialog() {
  inflightKey = null
  setStore({ ...initialStore })
}

/**
 * Fetch the sections for the target's grade, once. Idempotent: a concurrent
 * call (from a remounted host's effect) is a no-op while a fetch for the same
 * target is in flight or already resolved.
 */
export async function ensurePlacementSections(): Promise<void> {
  const { target, loaded, isLoading } = getStore()
  if (!target) return
  if (loaded) return
  const key = targetKey(target)
  if (isLoading && inflightKey === key) return
  inflightKey = key
  setStore({ isLoading: true })

  const result = await getAvailableSectionsForPlacement({
    gradeId: target.gradeId ?? undefined,
    applyingForClass: target.applyingForClass ?? undefined,
  })
  // Stale guard: the dialog was closed or re-targeted while we awaited.
  if (inflightKey !== key) return
  inflightKey = null
  setStore({
    isLoading: false,
    loaded: true,
    sections: result.success && result.data ? result.data : [],
  })
}

export function usePlacementDialogState(): PlacementStoreState {
  return useSyncExternalStore(subscribeStore, getStore, getStoreServerSnapshot)
}
