"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo } from "react"
import CountUp from "react-countup"

interface AnimatedCounterProps {
  amount: number
  prefix?: string
  decimals?: number
  duration?: number
}

/**
 * AnimatedCounter - Client component for animated number counting
 *
 * This component is memoized to prevent unnecessary re-renders when
 * parent components update. Only re-renders when the amount changes.
 *
 * @param amount - The target number to count up to
 * @param prefix - Optional prefix (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @param duration - Animation duration in seconds (default: 2)
 */
export const AnimatedCounter = memo(function AnimatedCounter({
  amount,
  prefix = "$",
  decimals = 2,
  duration = 2,
}: AnimatedCounterProps) {
  // Validate amount to prevent NaN issues
  const validAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0

  return (
    <div className="w-full">
      <CountUp
        end={validAmount}
        decimals={decimals}
        decimal="."
        prefix={prefix}
        separator=","
        duration={duration}
        preserveValue
        useEasing
      />
    </div>
  )
})
