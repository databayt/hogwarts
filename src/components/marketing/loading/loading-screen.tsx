"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"

interface LoadingScreenProps {
  isContentReady: boolean
  onComplete: () => void
}

export function LoadingScreen({
  isContentReady,
  onComplete,
}: LoadingScreenProps) {
  const [count, setCount] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  const startExitAnimation = useCallback(() => {
    setIsExiting(true)
    setTimeout(onComplete, 600)
  }, [onComplete])

  useEffect(() => {
    if (isExiting) return

    // When count reaches 100, start the exit animation
    if (count >= 100) {
      const timeout = setTimeout(startExitAnimation, 200)
      return () => clearTimeout(timeout)
    }

    // Content ready and past 90% — accelerate to 100
    if (isContentReady && count >= 90 && count < 100) {
      const timeout = setTimeout(() => {
        const remaining = 100 - count
        const increment = Math.max(Math.ceil(remaining / 3), 1)
        setCount((prev) => Math.min(prev + increment, 100))
      }, 40)
      return () => clearTimeout(timeout)
    }

    // Content ready but below 90% — speed up moderately
    if (isContentReady && count < 90) {
      const timeout = setTimeout(
        () => {
          const increment = Math.floor(Math.random() * 10) + 3
          setCount((prev) => Math.min(prev + increment, 90))
        },
        30 + Math.random() * 50
      )
      return () => clearTimeout(timeout)
    }

    // Pause at 90% if content not ready
    if (count >= 90 && !isContentReady) {
      return
    }

    // Normal progression 0-90%
    const timeout = setTimeout(
      () => {
        const increment = Math.floor(Math.random() * 8) + 1
        setCount((prev) => Math.min(prev + increment, 90))
      },
      50 + Math.random() * 100
    )

    return () => clearTimeout(timeout)
  }, [count, isContentReady, isExiting, startExitAnimation])

  return (
    <div className="bg-background fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="overflow-hidden" style={{ height: "1.5em" }}>
        <div
          className="text-foreground text-lg font-light transition-transform duration-500 ease-out"
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            transform: isExiting ? "translateY(-100%)" : "translateY(0)",
          }}
        >
          {count}%
        </div>
      </div>
    </div>
  )
}
