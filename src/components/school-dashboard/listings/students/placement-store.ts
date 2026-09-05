// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useSyncExternalStore } from "react"

import { getAvailableSectionsForPlacement } from "@/components/school-dashboard/admission/actions"

import type { StudentRow } from "./columns"

/**
 * Module-level store for the students-list "Assign Section" dialog.
 *
 * Same trap the credentials and access-code dialogs hit: the listings table
 * remounts when a Server Action invoked from inside it completes, and a local
 * `useState` open flag is wiped by that remount — the dialog flashed open and
 * closed before its section list had even arrived. The target student lives
 * here, outside React, and so does the section list: keeping it in the store
 * means a remount re-reads the already-fetched sections instead of resetting
 * to `[]` and fetching again — which would loop, since each completed fetch is
 * what remounts the table.
 */
export interface PlacementSection {
  id: string
  name: string
  enrolledStudents: number
  maxCapacity: number
}

export interface PlacementStoreState {
  open: boolean
  student: StudentRow | null
  sections: PlacementSection[]
  isLoading: boolean
  loaded: boolean
}

const initialStore: PlacementStoreState = {
  open: false,
  student: null,
  sections: [],
  isLoading: false,
  loaded: false,
}

let storeState: PlacementStoreState = initialStore
const storeListeners = new Set<() => void>()
/** Student id of the in-flight section fetch — a remount cannot start a second. */
let inflightStudentId: string | null = null

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

export function openPlacementDialog(student: StudentRow) {
  inflightStudentId = null
  setStore({
    open: true,
    student,
    sections: [],
    isLoading: false,
    loaded: false,
  })
}

export function closePlacementDialog() {
  inflightStudentId = null
  setStore({ ...initialStore })
}

/**
 * Fetch the sections for the targeted student's grade, once. Idempotent: a
 * concurrent call (from a remounted dialog's effect) is a no-op while a fetch
 * for the same student is in flight or already resolved.
 */
export async function ensurePlacementSections(): Promise<void> {
  const { student, loaded, isLoading } = getStore()
  if (!student) return
  if (loaded) return
  if (isLoading && inflightStudentId === student.id) return
  inflightStudentId = student.id
  setStore({ isLoading: true })

  const result = await getAvailableSectionsForPlacement({
    gradeId: student.academicGradeId,
    applyingForClass: student.gradeName ?? undefined,
  })
  // Stale guard: the dialog was closed or re-targeted while we awaited.
  if (inflightStudentId !== student.id) return
  inflightStudentId = null
  setStore({
    isLoading: false,
    loaded: true,
    sections: result.success && result.data ? result.data : [],
  })
}

export function usePlacementDialogState(): PlacementStoreState {
  return useSyncExternalStore(subscribeStore, getStore, getStoreServerSnapshot)
}
