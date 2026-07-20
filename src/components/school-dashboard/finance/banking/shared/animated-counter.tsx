"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useCallback } from "react"
import CountUp from "react-countup"

import { formatAmount } from "@/components/school-dashboard/finance/banking/lib/utils"

interface AnimatedCounterProps {
  amount: number
  /** ISO 4217 code from `School.currency`. */
  currency?: string
  /** UI locale ("ar" | "en") -- drives digit shaping and symbol placement. */
  locale?: string
  duration?: number
}

/**
 * AnimatedCounter - Client component for animated number counting
 *
 * Each intermediate frame is run through `formatAmount`, so the counter animates
 * in the school's own currency and the locale's own numerals instead of the
 * hardcoded "$1,234.00" it used to print regardless of tenant.
 *
 * Memoized to prevent unnecessary re-renders when parent components update.
 */
export const AnimatedCounter = memo(function AnimatedCounter({
  amount,
  currency = "USD",
  locale = "ar",
  duration = 2,
}: AnimatedCounterProps) {
  // Validate amount to prevent NaN issues
  const validAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0

  const format = useCallback(
    (value: number) => formatAmount(value, locale, currency),
    [locale, currency]
  )

  // A <span>, not a <div>: this renders inside the <p> of a stat card, and a
  // block element there is invalid HTML -- React logs it as a hydration error.
  return (
    <span className="block w-full tabular-nums">
      <CountUp
        end={validAmount}
        duration={duration}
        formattingFn={format}
        preserveValue
        useEasing
      />
    </span>
  )
})
