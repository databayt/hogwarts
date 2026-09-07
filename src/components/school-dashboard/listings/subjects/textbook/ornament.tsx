// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

/** The rope divider under a chapter opener — a rule with a twist. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      className={cn("book-ornament", className)}
      viewBox="0 0 200 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 10h60M136 10h60" />
      <path d="M64 10c9-10 18 10 27 0s18-10 27 0 18 10 27 0" />
      <path d="M64 10c9 10 18-10 27 0s18 10 27 0 18-10 27 0" />
    </svg>
  )
}
