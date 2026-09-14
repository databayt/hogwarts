// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useEffect, useState } from "react"

import { useCaptureSuspected } from "./capture-signal"

/**
 * Forensic watermark overlay — two layers, because nothing in a browser can
 * stop a capture and nothing in a browser is told one is happening.
 *
 * 1. **Forensic** — always on, never meant to be noticed. The viewer's code is
 *    tiled across the whole frame in large, soft, very low-contrast letters: a
 *    light copy and a dark twin a hair apart, so it sits in bright and dark
 *    scenes alike. The eye reads past it; a screenshot or recording keeps it,
 *    and raising the contrast of the leaked frame (`scripts/watermark/reveal.py`)
 *    brings the code back. Large and soft on purpose: the first watermark was
 *    small sharp text at 6%, and video compression erased it completely — high
 *    spatial frequency is the first thing an encoder throws away.
 *
 * 2. **Visible** — the roaming identity and the fixed diagonal, shown only
 *    while `useCaptureSuspected` says a capture may be starting (the capture
 *    chord's modifiers, PrintScreen, the window losing focus, a PiP attempt).
 *    Abdout, 2026-09-14: the mark should appear at capture time, not always.
 *    That signal is partial by nature, which is the reason layer 1 exists.
 *
 * The overlay is a DOM sibling of the media, so it is composited only where
 * the page is. Picture-in-Picture and casting render the bare element without
 * it — which is why protected players disable both.
 *
 * The code is the last eight characters of the user id: unique enough to find
 * the account (`WHERE id LIKE '%<code>'`), meaningless to anyone else who sees
 * the frame. The visible mark adds a masked email so the viewer recognises
 * themselves in it — that is the deterrent.
 */

interface VideoWatermarkProps {
  /** User identifier — source of the forensic code */
  userId?: string
  /** User email, masked, for the visible mark */
  userEmail?: string
  /** Whether watermark is active */
  enabled?: boolean
  /** Visible mark's rotation interval in ms (default: 30000 = 30s) */
  rotationInterval?: number
  /** Print when viewing started beside the identity (default: true). The
   *  live room turns it off; the mark still names the viewer. */
  showTimestamp?: boolean
}

// 9 possible positions (3x3 grid) for the roaming visible mark
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

/**
 * The forensic layer's opacity — MEASURED, not chosen (2026-09-14, harness in
 * `scripts/watermark/`: the real markup over `public/story.mp4`, captured as
 * stills and as a VP8 screen recording, then `reveal.py`):
 *
 * | alpha | Δ on screen (p95, of 255) | code from the compressed recording |
 * | ----- | ------------------------- | ---------------------------------- |
 * | 4.5%  | 10                        | clear — and plainly visible live    |
 * | 1.5%  | 4                         | clear                              |
 * | 1%    | 3                         | clear in every frame tried         |
 * | 0.7%  | 2                         | breaking up                        |
 *
 * 1% is the floor that still recovers. It is unnoticeable over real content;
 * on a flat near-black frame a viewer hunting for it can just make it out.
 * Re-run the harness before changing it, or the font, weight or blur.
 */
const FORENSIC_ALPHA = 0.01

/** Rows × columns of the forensic tile. Enough to survive a tight crop. */
const TILE_ROWS = 10
const TILE_COLS = 6

/** Exported for the reveal test and the audit lookup — one definition. */
export function watermarkCode(userId: string): string {
  return userId.slice(-8)
}

/** `abc***@school.com`; a non-email (a display name) is not printed at all. */
export function maskEmail(email: string | undefined): string | null {
  if (!email) return null
  const at = email.indexOf("@")
  if (at < 1) return null
  return `${email.slice(0, Math.min(3, at))}***${email.slice(at)}`
}

export function VideoWatermark({
  userId,
  userEmail,
  enabled = true,
  rotationInterval = 30000,
  showTimestamp = true,
}: VideoWatermarkProps) {
  const suspected = useCaptureSuspected(enabled)

  const [positionIndex, setPositionIndex] = useState(() =>
    Math.floor(Math.random() * POSITIONS.length)
  )
  const [rotation, setRotation] = useState(
    () => Math.floor(Math.random() * 30) - 15
  )

  // Capture once at mount — the mark records when viewing started, and
  // recomputing per render churned the string on every timeupdate tick.
  // Hooks stay above the early return: React requires a stable hook order.
  const [timestamp] = useState(() =>
    new Date().toISOString().slice(0, 16).replace("T", " ")
  )

  // Move the visible mark while it is up, so cropping one region does not
  // clean a recording made during a long suspected window.
  useEffect(() => {
    if (!enabled || !suspected) return
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
  }, [enabled, suspected, rotationInterval])

  if (!enabled || !userId) return null

  const code = watermarkCode(userId)
  const masked = maskEmail(userEmail)
  const identity = masked ? `${masked} · ${code}` : code
  const position = POSITIONS[positionIndex]

  return (
    <div
      data-video-protected
      data-watermark
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden select-none"
    >
      {/* 1. Forensic — always on, below notice, recoverable from a capture */}
      <div
        data-watermark-forensic
        className="absolute inset-[-50%] grid content-center justify-center gap-y-[clamp(2.5rem,9vw,7rem)] font-sans font-black whitespace-nowrap"
        style={{
          transform: "rotate(-24deg)",
          fontSize: "clamp(20px, 3.6vw, 52px)",
          letterSpacing: "0.12em",
          filter: "blur(0.6px)",
        }}
      >
        {Array.from({ length: TILE_ROWS }, (_, row) => (
          <div
            key={row}
            className="flex gap-x-[clamp(2rem,8vw,6rem)]"
            // Stagger alternate rows so no straight band is left unmarked.
            style={{ marginInlineStart: row % 2 ? "4em" : 0 }}
          >
            {Array.from({ length: TILE_COLS }, (_, col) => (
              <span
                key={col}
                style={{
                  color: `rgba(255,255,255,${FORENSIC_ALPHA})`,
                  textShadow: `0.06em 0.06em 0 rgba(0,0,0,${FORENSIC_ALPHA})`,
                }}
              >
                {code}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* 2. Visible — only while a capture may be happening */}
      <div
        data-watermark-visible={suspected ? "on" : "off"}
        className="absolute inset-0 transition-opacity duration-150"
        style={{ opacity: suspected ? 1 : 0 }}
      >
        {/* Roaming mark — defeats cropping a single fixed region */}
        <div
          className="absolute font-mono text-[12px] leading-tight whitespace-nowrap text-white/45 transition-all duration-1000 [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]"
          style={{ ...position, transform: `rotate(${rotation}deg)` }}
        >
          {identity}
          {showTimestamp && (
            <>
              <br />
              {timestamp}
            </>
          )}
        </div>

        {/* Fixed diagonal mark — cannot be cropped out without losing the frame */}
        <div
          className="absolute top-1/2 left-1/2 font-mono text-[15px] whitespace-nowrap text-white/30 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
          style={{ transform: "translate(-50%, -50%) rotate(-28deg)" }}
        >
          {showTimestamp ? `${identity} · ${timestamp}` : identity}
        </div>
      </div>
    </div>
  )
}
