"use client"

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
