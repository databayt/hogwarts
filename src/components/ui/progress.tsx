"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden",
        className
      )}
      {...props}
    >
      <ProgressIndicator value={value} />
    </ProgressPrimitive.Root>
  )
}

/**
 * WHY scaleX + a CSS transform-origin instead of a JS-measured translateX:
 *
 * This used to read `document.documentElement.dir` in an effect, which cannot
 * run until after the first paint. So on an Arabic route the bar mounted as
 * LTR (anchored at the left, animating in from `translateX(-100%)`), the effect
 * then flipped `dir` to "rtl", and Framer animated a SECOND time to the
 * right-anchored position — the visible blink on first open. The server HTML
 * was wrong for the same reason.
 *
 * `dir` is already on <html> server-side (see app/layout.tsx), so the `rtl:`
 * variant resolves during the very first paint, on the server and the client
 * alike. Scaling from the inline-start edge needs no percentage math and no
 * direction state at all.
 */
function ProgressIndicator({ value }: { value?: number | null }) {
  const scale = Math.min(Math.max(value || 0, 0), 100) / 100

  // CSS, not framer-motion: Progress renders on 80+ screens, and the motion
  // import put framer-motion in the initial JS of nearly every route. The
  // keyframe grows the bar from empty on mount; the transition follows later
  // value changes. Same curve and duration as before.
  return (
    <div
      data-slot="progress-indicator"
      className="bg-primary motion-safe:animate-progress-in h-full w-full flex-1 origin-left transition-transform duration-800 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none rtl:origin-right"
      style={{ transform: `scaleX(${scale})` }}
    />
  )
}

export { Progress }
