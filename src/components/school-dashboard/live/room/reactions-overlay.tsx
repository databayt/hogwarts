"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import type { ClassChannel } from "./use-class-channel"

interface Floating {
  key: number
  emoji: string
  name: string
  /** 0..1 across the lane, so a burst fans out instead of stacking. */
  lane: number
}

const LIFE_MS = 2600
const MAX_FLOATING = 20

/**
 * Reactions float up the stage's far edge — the emoji large, the sender's
 * first name under it — and are gone in under three seconds. Nothing is
 * stored: a reaction is a moment, not a record. Reduced motion fades in
 * place instead of rising.
 */
export function ReactionsOverlay({ channel }: { channel: ClassChannel }) {
  const [items, setItems] = useState<Floating[]>([])

  const { subscribe } = channel
  useEffect(() => {
    let seq = 0
    return subscribe((e) => {
      if (e.kind !== "react") return
      const key = ++seq + Date.now()
      const first = e.name.trim().split(/\s+/)[0] ?? ""
      setItems((xs) =>
        [
          ...xs,
          { key, emoji: e.emoji, name: first, lane: Math.random() },
        ].slice(-MAX_FLOATING)
      )
      window.setTimeout(
        () => setItems((xs) => xs.filter((x) => x.key !== key)),
        LIFE_MS
      )
    })
  }, [subscribe])

  return (
    <div
      className="pointer-events-none absolute inset-y-0 end-0 z-10 w-44 overflow-hidden"
      aria-hidden
    >
      {items.map((it) => (
        <span
          key={it.key}
          className="absolute bottom-[22%] flex flex-col items-center"
          style={{ insetInlineEnd: `${20 + it.lane * 72}px` }}
          ref={(el) => {
            if (!el || el.dataset.run) return
            el.dataset.run = "1"
            const still = window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches
            const drift = (it.lane - 0.5) * 30
            el.animate(
              still
                ? [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }]
                : [
                    { transform: "translate(0, 0) scale(0.6)", opacity: 0 },
                    {
                      transform: "translate(0, -40px) scale(1.15)",
                      opacity: 1,
                      offset: 0.15,
                    },
                    {
                      transform: `translate(${drift}px, -260px) scale(1)`,
                      opacity: 0,
                    },
                  ],
              {
                duration: LIFE_MS,
                easing: "cubic-bezier(.2,.7,.3,1)",
                fill: "forwards",
              }
            )
          }}
        >
          <span className="text-4xl leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
            {it.emoji}
          </span>
          {it.name && (
            <span className="mt-1 max-w-24 truncate rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
              {it.name}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
