"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useLayoutEffect, useSyncExternalStore } from "react"

let title: string | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

export function useBreadcrumbTitle() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => title,
    () => null
  )
}

export function BreadcrumbTitle({ title: t }: { title: string }) {
  useLayoutEffect(() => {
    title = t
    emit()
    return () => {
      title = null
      emit()
    }
  }, [t])
  return null
}
