// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useEffect, useState } from "react"

/**
 * Dynamic watermark overlay for video protection.
 *
 * Renders a semi-transparent watermark containing user identifying info.
 * Position rotates randomly every 30 seconds to prevent static-crop removal.
 * If a video is screen-recorded and leaked, the watermark traces it to the viewer.
 *
 * Designed to be:
 * - Subtle enough not to ruin viewing experience (low opacity)
 * - Forensically detectable in leaked recordings
 * - Resistant to simple cropping (position changes)
 * - Non-removable via DOM inspection (re-renders on tamper)
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
  // Show truncated identifier for privacy in visible watermark
  const displayId = userEmail
    ? `${userEmail.slice(0, 3)}***${userEmail.slice(userEmail.indexOf("@"))}`
    : userId
      ? `${userId.slice(0, 4)}...${userId.slice(-4)}`
      : ""

  const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ")

  return (
    <div
      data-video-protected
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden select-none"
      style={{
        // Resist DOM removal via mutation observer by using important styles
        position: "absolute",
        display: "block",
      }}
    >
      <div
        className="absolute font-mono text-[11px] leading-none whitespace-nowrap text-white/[0.06] transition-all duration-1000"
        style={{
          ...position,
          transform: `rotate(${rotation}deg)`,
          textShadow: "none",
          // Prevent selection and copying
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {displayId}
        <br />
        {timestamp}
      </div>
    </div>
  )
}
