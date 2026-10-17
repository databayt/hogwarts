"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import {
  glassPill,
  glassSurface,
} from "@/components/lumos/shared/video-player/glass"

export interface RoomToast {
  id: string
  text: string
  icon?: ReactNode
  actions?: Array<{ label: string; onClick: () => void; primary?: boolean }>
  /** How long it stays, in ms. */
  ttl?: number
}

const MAX_TOASTS = 3

/** The room's own notices — on its glass, not the app's toaster. */
export function useRoomToasts() {
  const [toasts, setToasts] = useState<RoomToast[]>([])
  const timers = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
    const h = timers.current.get(id)
    if (h) window.clearTimeout(h)
    timers.current.delete(id)
  }, [])

  const push = useCallback(
    (toast: RoomToast) => {
      setToasts((ts) =>
        [...ts.filter((t) => t.id !== toast.id), toast].slice(-MAX_TOASTS)
      )
      const prev = timers.current.get(toast.id)
      if (prev) window.clearTimeout(prev)
      timers.current.set(
        toast.id,
        window.setTimeout(() => dismiss(toast.id), toast.ttl ?? 4000)
      )
    },
    [dismiss]
  )

  useEffect(() => {
    const all = timers.current
    return () => {
      for (const h of all.values()) window.clearTimeout(h)
    }
  }, [])

  return { toasts, push, dismiss }
}

export type RoomToasts = ReturnType<typeof useRoomToasts>

/**
 * The stack under the top row. A polite live region, so a screen reader
 * hears "Amira raised a hand" without losing its place.
 */
export function RoomToastStack({
  toasts,
  dismiss,
}: Pick<RoomToasts, "toasts" | "dismiss">) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            glassPill,
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 pointer-events-auto flex max-w-[min(26rem,calc(100vw-2rem))] items-center gap-2 py-1.5 ps-3 pe-1.5 text-[15px] text-white",
            !t.actions?.length && "pe-4"
          )}
          style={{ ...glassSurface, background: "rgba(20, 20, 20, 0.75)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {t.icon}
          <span className="min-w-0 flex-1 truncate py-1.5">{t.text}</span>
          {t.actions?.map((a) => (
            <button
              key={a.label}
              type="button"
              className={cn(
                "min-h-9 shrink-0 rounded-full px-3 text-sm font-semibold transition-opacity active:opacity-60",
                a.primary ? "bg-white text-black" : "bg-white/15 text-white"
              )}
              onClick={() => {
                a.onClick()
                dismiss(t.id)
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
