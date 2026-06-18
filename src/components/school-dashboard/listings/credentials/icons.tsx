// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Contact-channel glyphs for the credentials dialog. Kept local to the block
// (not the global icon registry) — they're one-off contact marks used only here.
// Each inherits `currentColor` and is sized via className.
//
// Consistency: every glyph is normalized to fill ~16/24 of the viewBox and the
// stroke-based ones render at an effective stroke width of 1.5, so WhatsApp,
// Email and SMS read at the same visual weight and size.
import type { SVGProps } from "react"

export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      {/* Solid logo spans ~2–22; scale to ~16 to match the outline glyphs. */}
      <g transform="translate(12 12) scale(0.82) translate(-12 -12)">
        <path
          fill="currentColor"
          d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91c0-2.65-1.03-5.14-2.9-7.01m-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18l-3.12.82l.83-3.04l-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23m4.52-6.16c-.25-.12-1.47-.72-1.69-.81c-.23-.08-.39-.12-.56.12c-.17.25-.64.81-.78.97c-.14.17-.29.19-.54.06c-.25-.12-1.05-.39-1.99-1.23c-.74-.66-1.23-1.47-1.38-1.72c-.14-.25-.02-.38.11-.51c.11-.11.25-.29.37-.43s.17-.25.25-.41c.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31c-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74c.59.26 1.05.41 1.41.52c.59.19 1.13.16 1.56.1c.48-.07 1.47-.6 1.67-1.18c.21-.58.21-1.07.14-1.18s-.22-.16-.47-.28"
        />
      </g>
    </svg>
  )
}

export function EmailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <g fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect width="16" height="12" x="4" y="6" rx="2" />
        <path d="m4 9l7.106 3.553a2 2 0 0 0 1.788 0L20 9" />
      </g>
    </svg>
  )
}

export function MessageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      {/* Bubble spans ~5.5–18.5; scale 1.25 (stroke 1.2 → effective 1.5) so it
          matches the others in both size and stroke weight. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        transform="translate(12 12) scale(1.25) translate(-12 -12)"
      >
        <path d="M8.5 18.396V15.5h-2a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H12l-3.073 3.073a.25.25 0 0 1-.427-.177Z" />
        <path strokeLinecap="round" d="M8.5 12.5h7m-7-3h7" />
      </g>
    </svg>
  )
}
