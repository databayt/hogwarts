"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"

/**
 * ShadcnFieldSlider - Range slider with dynamic value display
 *
 * Price range selector with real-time value updates.
 *
 * @example
 * ```tsx
 * <ShadcnFieldSlider />
 * ```
 */
export function ShadcnFieldSlider() {
  const [value, setValue] = useState([200, 800])

  return (
    <div className="w-full max-w-md space-y-4">
      <div>
        <div className="font-medium">Price Range</div>
        <p className="text-sm text-muted-foreground">
          Set your budget range ($
          <span className="font-medium tabular-nums">{value[0]}</span> -{" "}
          <span className="font-medium tabular-nums">{value[1]}</span>).
        </p>
      </div>
      <Slider
        value={value}
        onValueChange={setValue}
        max={1000}
        min={0}
        step={10}
        className="w-full"
        aria-label="Price Range"
      />
    </div>
  )
}
