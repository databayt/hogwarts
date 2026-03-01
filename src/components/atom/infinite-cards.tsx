"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useMemo, useRef } from "react"

import { cn } from "@/lib/utils"

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    quote: string
    name: string
    title: string
  }[]
  direction?: "left" | "right"
  speed?: "fast" | "normal" | "slow"
  pauseOnHover?: boolean
  className?: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Duplicate items in React instead of DOM cloning
  // This ensures items stay in sync when dictionary loads asynchronously
  const duplicatedItems = useMemo(() => [...items, ...items], [items])

  useEffect(() => {
    if (!containerRef.current) return

    // Detect RTL from document direction
    const isRTL = document.documentElement.dir === "rtl"

    // In RTL, flip the physical scroll direction so cards flow naturally
    const effectiveDirection = isRTL
      ? direction === "left"
        ? "right"
        : "left"
      : direction

    containerRef.current.style.setProperty(
      "--animation-direction",
      effectiveDirection === "left" ? "forwards" : "reverse"
    )

    const duration =
      speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s"
    containerRef.current.style.setProperty("--animation-duration", duration)
  }, [direction, speed, items])

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        className={cn(
          "animate-scroll flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {duplicatedItems.map((item, idx) => (
          <li
            className="relative w-[350px] max-w-full shrink-0 rounded-2xl border border-b-0 border-zinc-200 bg-[linear-gradient(180deg,#fafafa,#f5f5f5)] px-8 py-6 md:w-[450px] dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#27272a,#18181b)]"
            key={`${item.name}-${idx}`}
          >
            <blockquote dir="auto">
              <div
                aria-hidden="true"
                className="user-select-none pointer-events-none absolute -start-0.5 -top-0.5 -z-1 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <span className="muted relative z-20 leading-[1.6] text-neutral-800 dark:text-gray-100">
                {item.quote}
              </span>
              <div className="relative z-20 flex flex-row items-center pt-6">
                <span className="flex flex-col gap-1">
                  <span className="muted leading-[1.6] text-neutral-500 dark:text-gray-400">
                    {item.name}
                  </span>
                  <span className="muted leading-[1.6] text-neutral-500 dark:text-gray-400">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  )
}
