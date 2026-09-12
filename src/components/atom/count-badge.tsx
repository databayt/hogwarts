"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

/**
 * The unread count that rides on a toolbar icon.
 *
 * One component rather than one per icon, because the bell and the mail sit
 * side by side in the phone menu and any difference between them reads as a
 * mistake — they drifted to two heights, two type sizes and two corner offsets
 * while nobody was looking at them together.
 *
 * Shaped for the smallest thing it has to sit on. It rides the corner of the
 * GLYPH, not of the button, so it stays put whatever padding the button has;
 * the corner it takes is mirrored under RTL, where the glyph's free corner is
 * the other one.
 *
 * `tabular-nums` so a count ticking 9 → 10 → 11 does not make the pill breathe,
 * and `min-w` with a round radius so one digit is a circle and two are a
 * capsule. Past ninety-nine it stops counting and says so: a real inbox can
 * reach four digits, and the number stopped being information long before it
 * got that wide.
 */
export function CountBadge({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "pointer-events-none absolute -top-1.5 ltr:-right-1.5 rtl:-left-1.5",
            className
          )}
        >
          <Badge
            variant="destructive"
            className="h-4 min-w-4 justify-center px-1 text-[10px] leading-none font-semibold tabular-nums"
          >
            {count > 99 ? "99+" : count}
          </Badge>
        </motion.span>
      )}
    </AnimatePresence>
  )
}
