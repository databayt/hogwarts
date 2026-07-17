// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useSyncExternalStore } from "react"

import { generateStudentAccessCodes } from "./actions"

/**
 * Module-level store for the "Link Parent" access-code dialog. Lives outside
 * React so it survives the listings-table remount that Next.js triggers when
 * the access-code Server Action (invoked from inside the dialog) completes —
 * a local `useState` open flag was wiped by that remount, so the dialog
 * flashed open then closed and "Link Parent" appeared to do nothing.
 *
 * Codes live in the store too: keeping them here (not in dialog `useState`)
 * means a remount mid-flow re-reads the already-generated codes instead of
 * resetting to `[]` and re-triggering generation — which would loop, since
 * each generation is what remounts the table.
 *
 * Mirrors the sibling credentials dialog store (`../credentials/store.ts`).
 */
export interface AccessCodeResult {
  studentId: string
  code: string
  expiresAt: string
}

export interface AccessCodeStoreState {
  open: boolean
  studentIds: string[]
  studentNames: Record<string, string>
  codes: AccessCodeResult[]
  error: string | null
  isLoading: boolean
}

const initialStore: AccessCodeStoreState = {
  open: false,
  studentIds: [],
  studentNames: {},
  codes: [],
  error: null,
  isLoading: false,
}

let storeState: AccessCodeStoreState = initialStore
const storeListeners = new Set<() => void>()

/** Signature of the in-flight generation, so a remount can't start a second. */
let inflightKey: string | null = null

function notifyStore() {
  storeListeners.forEach((l) => l())
}

function setStore(patch: Partial<AccessCodeStoreState>) {
  storeState = { ...storeState, ...patch }
  notifyStore()
}

function getStore(): AccessCodeStoreState {
  return storeState
}

function subscribeStore(cb: () => void) {
  storeListeners.add(cb)
  return () => {
    storeListeners.delete(cb)
  }
}

function getStoreServerSnapshot(): AccessCodeStoreState {
  return initialStore
}

export function openAccessCodeDialog(
  studentIds: string[],
  studentNames: Record<string, string>
) {
  setStore({
    open: true,
    studentIds,
    studentNames,
    codes: [],
    error: null,
    isLoading: false,
  })
}

export function closeAccessCodeDialog() {
  inflightKey = null
  setStore({ ...initialStore })
}

/**
 * Generate codes for the currently-targeted students, once. Idempotent: a
 * concurrent call (e.g. from a remounted dialog's effect) is a no-op while a
 * generation for the same students is in flight or already resolved.
 *
 * @param fallbackError message shown when the action returns no usable error.
 */
export async function ensureAccessCodes(fallbackError: string): Promise<void> {
  const { studentIds, codes, isLoading } = getStore()
  if (studentIds.length === 0) return
  if (codes.length > 0) return
  const key = studentIds.join(",")
  if (isLoading && inflightKey === key) return
  inflightKey = key
  setStore({ isLoading: true, error: null })

  const result = await generateStudentAccessCodes({ studentIds })
  // Stale guard: the dialog was closed or re-targeted while we awaited.
  if (inflightKey !== key) return

  if (result.success && result.data) {
    inflightKey = null
    setStore({
      isLoading: false,
      // studentName is resolved at render time from `studentNames`.
      codes: result.data.map((c) => ({
        studentId: c.studentId,
        code: c.code,
        expiresAt: c.expiresAt,
      })),
    })
  } else {
    inflightKey = null
    setStore({
      isLoading: false,
      error: ("error" in result && result.error) || fallbackError,
    })
  }
}

export function useAccessCodeDialogState(): AccessCodeStoreState {
  return useSyncExternalStore(subscribeStore, getStore, getStoreServerSnapshot)
}
