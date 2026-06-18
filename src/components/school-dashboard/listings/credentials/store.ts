// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useSyncExternalStore } from "react"

import type { CredentialsPayload, CredentialsRole } from "./types"

/**
 * Module-level store for the credentials dialog. Lives outside React so it
 * survives the listing-table remount triggered by Next.js server-action
 * revalidation — the server action invoked inside the dialog would otherwise
 * unmount the subtree and lose every useState, closing the dialog before the
 * admin could read the credentials.
 *
 * A single store + single mounted <CredentialsDialog/> serves every role: only
 * one listing table is mounted at a time, and `openCredentialsDialog` carries
 * the role so the dialog knows which person model to target.
 */
export interface DialogStoreState {
  open: boolean
  role: CredentialsRole | null
  id: string | null
  name: string
  /** Short role/grade label shown as a badge next to the name (e.g. "Grade 5",
   *  a department, a position, or "Guardian"). Empty hides the badge. */
  badge: string
  credentials: CredentialsPayload | null
  error: string | null
  isLoading: boolean
  isResetting: boolean
}

const initialStore: DialogStoreState = {
  open: false,
  role: null,
  id: null,
  name: "",
  badge: "",
  credentials: null,
  error: null,
  isLoading: false,
  isResetting: false,
}

let storeState: DialogStoreState = initialStore
const storeListeners = new Set<() => void>()

// Session cache of generated credentials, keyed by role+id. Reopening the same
// person shows the cached login instantly — no `—` flash, no re-mint, no
// server round-trip — which is what made the dialog appear to "reload" on every
// open. Lives for the tab; cleared on full page reload.
const credentialsCache = new Map<string, CredentialsPayload>()
const cacheKey = (role: CredentialsRole, id: string) => `${role}:${id}`

export function getCachedCredentials(
  role: CredentialsRole,
  id: string
): CredentialsPayload | null {
  return credentialsCache.get(cacheKey(role, id)) ?? null
}

export function setCachedCredentials(
  role: CredentialsRole,
  id: string,
  payload: CredentialsPayload
) {
  credentialsCache.set(cacheKey(role, id), payload)
}

/** Tracks the in-flight load so a stale response can't clobber a newer one. */
export let inflightId: string | null = null
export function setInflightId(value: string | null) {
  inflightId = value
}

function notifyStore() {
  storeListeners.forEach((l) => l())
}

export function setStore(patch: Partial<DialogStoreState>) {
  storeState = { ...storeState, ...patch }
  notifyStore()
}

export function getStore(): DialogStoreState {
  return storeState
}

function subscribeStore(cb: () => void) {
  storeListeners.add(cb)
  return () => {
    storeListeners.delete(cb)
  }
}

function getStoreServerSnapshot(): DialogStoreState {
  return initialStore
}

export function openCredentialsDialog(
  role: CredentialsRole,
  id: string,
  name: string,
  badge = ""
) {
  // Seed from the session cache so a reopen paints the login immediately and
  // never re-generates (the source of the per-open "reload").
  const cached = getCachedCredentials(role, id)
  setStore({
    open: true,
    role,
    id,
    name,
    badge,
    credentials: cached,
    error: null,
    isLoading: !cached,
    isResetting: false,
  })
}

export function closeCredentialsDialog() {
  inflightId = null
  setStore({ ...initialStore })
}

export function useCredentialsDialogState(): DialogStoreState {
  return useSyncExternalStore(subscribeStore, getStore, getStoreServerSnapshot)
}
