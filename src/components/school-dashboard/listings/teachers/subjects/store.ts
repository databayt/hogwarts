// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useSyncExternalStore } from "react"

/**
 * Module-level store for the "Assign subjects" dialog — same reason as the
 * credentials dialog: saving refreshes the page, which remounts the teachers
 * table, and dialog state kept in the table's useState would close it.
 */
export interface AssignSubjectsDialogState {
  open: boolean
  teacherId: string | null
  name: string
}

const initial: AssignSubjectsDialogState = {
  open: false,
  teacherId: null,
  name: "",
}

let state = initial
const listeners = new Set<() => void>()

function set(next: AssignSubjectsDialogState) {
  state = next
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function openAssignSubjectsDialog(teacherId: string, name: string) {
  set({ open: true, teacherId, name })
}

export function closeAssignSubjectsDialog() {
  set(initial)
}

export function useAssignSubjectsDialog(): AssignSubjectsDialogState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial
  )
}
