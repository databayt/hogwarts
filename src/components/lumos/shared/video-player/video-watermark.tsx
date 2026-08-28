// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useEffect, useState } from "react"

/**
 * Forensic watermark overlay.
 *
 * This is the only layer that does anything about screen recording, and it
 * works by attribution rather than prevention: nothing in a browser can stop
 * a capture, so instead every frame carries who was watching. A leaked
 * recording identifies its source.
 *
 * That only holds if the mark is actually legible in the capture. The first
 * version rendered at 6% opacity, which video compression erased completely —
 * present in the DOM, useless in evidence. It now renders at a low but
 * survivable opacity, and in two parts:
 *
 * - a **roaming** mark that changes position every 30s, so cropping a fixed
 *   region does not clean the whole recording
 * - a **fixed diagonal** mark across the centre, which cannot be cropped away
 *   without destroying the content itself
 *
 * Note the overlay is a DOM sibling of the <video>, so it is composited only
 * where the page is. Picture-in-Picture renders the raw video element alone
 * and would strip it entirely — which is why the player disables PiP for
 * protected content.
 */

interface VideoWatermarkProps {
  /** User identifier displayed in watermark */
  userId?: string
  /** User email for stronger identification */
  userEmail?: string
  /** Whether watermark is active */
  enabled?: boolean
  /** Rotation interval in ms (default: 30000 = 30s) */
  rotationInterval?: number
}

// 9 possible positions (3x3 grid) for watermark placement
const POSITIONS = [
  { top: "15%", left: "10%" },
  { top: "15%", left: "45%" },
  { top: "15%", right: "10%" },
  { top: "50%", left: "10%" },
  { top: "50%", left: "45%" },
  { top: "50%", right: "10%" },
  { bottom: "20%", left: "10%" },
  { bottom: "20%", left: "45%" },
  { bottom: "20%", right: "10%" },
] as const

export function VideoWatermark({
  userId,
  userEmail,
  enabled = true,
  rotationInterval = 30000,
}: VideoWatermarkProps) {
  const [positionIndex, setPositionIndex] = useState(() =>
    Math.floor(Math.random() * POSITIONS.length)
  )
  const [rotation, setRotation] = useState(
    () => Math.floor(Math.random() * 30) - 15
  )

  // Capture once at mount — the watermark records when viewing started, and
  // recomputing per render churned the string on every timeupdate tick.
  // Hooks stay above the early return: React requires a stable hook order.
  const [timestamp] = useState(() =>
    new Date().toISOString().slice(0, 16).replace("T", " ")
  )

  // Rotate position periodically
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      setPositionIndex((prev) => {
        let next: number
        do {
          next = Math.floor(Math.random() * POSITIONS.length)
        } while (next === prev)
        return next
      })
      setRotation(Math.floor(Math.random() * 30) - 15)
    }, rotationInterval)

    return () => clearInterval(interval)
  }, [enabled, rotationInterval])

  if (!enabled || (!userId && !userEmail)) return null

  const position = POSITIONS[positionIndex]
  // Truncated identifier: enough to trace a leak back through the audit log,
  // not enough to expose a classmate's full address on a shared screen.
  const displayId = userEmail
    ? `${userEmail.slice(0, 3)}***${userEmail.slice(userEmail.indexOf("@"))}`
    : userId
      ? `${userId.slice(0, 4)}...${userId.slice(-4)}`
      : ""

  return (
    <div
      data-video-protected
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden select-none"
    >
      {/* Roaming mark — defeats cropping a single fixed region */}
      <div
        className="absolute font-mono text-[11px] leading-tight whitespace-nowrap text-white/20 transition-all duration-1000 [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]"
        style={{
          ...position,
          transform: `rotate(${rotation}deg)`,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {displayId}
        <br />
        {timestamp}
      </div>

      {/* Fixed diagonal mark — cannot be cropped out without losing the frame */}
      <div
        className="absolute top-1/2 left-1/2 font-mono text-[13px] whitespace-nowrap text-white/[0.09] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]"
        style={{
          transform: "translate(-50%, -50%) rotate(-28deg)",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {displayId} · {timestamp}
      </div>
    </div>
  )
}
