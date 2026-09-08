"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, type CSSProperties } from "react"

import { fill } from "./format"
import type { CoverInfo, ReaderLabels } from "./types"

/** Average the cover's pixels into a deep, slightly saturated tint for the
 *  hero — the store page's trick. Throws on a tainted canvas (no CORS). */
function dominantTint(img: HTMLImageElement): string | null {
  const canvas = document.createElement("canvas")
  canvas.width = 12
  canvas.height = 12
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, 12, 12)
  const { data } = ctx.getImageData(0, 0, 12, 12)
  let r = 0
  let g = 0
  let b = 0
  const n = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  r /= n * 255
  g /= n * 255
  b /= n * 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  const sat = Math.min(0.55, Math.max(0.28, s))
  return `hsl(${Math.round(h)} ${Math.round(sat * 100)}% 30%)`
}

export function CoverScreen({
  cover,
  title,
  edition,
  labels,
  canResume,
  onStart,
  onContents,
  onAbout,
}: {
  cover: CoverInfo
  title: string
  edition: string | null
  labels: ReaderLabels
  canResume: boolean
  onStart: () => void
  onContents: () => void
  onAbout: () => void
}) {
  const [tint, setTint] = useState<string | null>(null)

  useEffect(() => {
    if (!cover.url) return
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        setTint(dominantTint(img))
      } catch {
        /* cross-origin without CORS headers — keep the neutral tint */
      }
    }
    img.src = cover.url
  }, [cover.url])

  return (
    <div
      className="book-cover"
      style={tint ? ({ "--book-tint": tint } as CSSProperties) : undefined}
    >
      {/* The book opens on its cover, at the size of the screen. */}
      <div className="book-cover-art" data-chrome>
        {cover.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={fill(labels.coverAlt, { title })}
            decoding="async"
          />
        ) : (
          <div className="book-cover-fallback">{title}</div>
        )}
      </div>
      {/* The board's free head carries what a textbook prints there. */}
      <div className="book-cover-plate">
        {cover.stage && <p className="book-cover-stage">{cover.stage}</p>}
        <h1 className="book-cover-title">{title}</h1>
        {cover.gradeLine && (
          <p className="book-cover-grade">{cover.gradeLine}</p>
        )}
        {edition && <p className="book-cover-edition">{edition}</p>}
        {cover.stats.length > 0 && (
          <p className="book-cover-stats">{cover.stats.join(" • ")}</p>
        )}
      </div>
      <div className="book-cover-foot">
        <div className="book-cover-card">
          <div className="book-cover-actions">
            <button
              type="button"
              className="book-pill book-pill-ghost"
              onClick={onContents}
            >
              {labels.contents}
            </button>
            <button
              type="button"
              className="book-pill book-pill-solid"
              onClick={onStart}
            >
              {canResume ? labels.continueReading : labels.startReading}
            </button>
          </div>
        </div>
        {cover.description && (
          <button type="button" className="book-cover-about" onClick={onAbout}>
            {labels.aboutBook}
          </button>
        )}
      </div>
    </div>
  )
}
