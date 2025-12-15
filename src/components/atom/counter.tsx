"use client"

import { Minus, Plus } from "lucide-react"

interface CounterProps {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  min?: number
  max?: number
  step?: number
}

export function Counter({
  value,
  onIncrement,
  onDecrement,
  min = 0,
  max = 100,
  step = 1,
}: CounterProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={onDecrement}
        disabled={value <= min}
        className={`flex h-10 min-h-[40px] w-10 items-center justify-center rounded-full border transition-colors sm:h-7 sm:min-h-[28px] sm:w-7 ${
          value <= min
            ? "border-muted text-muted-foreground cursor-not-allowed"
            : "border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground active:scale-95"
        }`}
        type="button"
      >
        <Minus size={16} strokeWidth={2} className="sm:h-3.5 sm:w-3.5" />
      </button>
      <span className="w-8 text-center sm:w-2.5">{value}</span>
      <button
        onClick={onIncrement}
        disabled={value >= max}
        className={`flex h-10 min-h-[40px] w-10 items-center justify-center rounded-full border transition-colors sm:h-7 sm:min-h-[28px] sm:w-7 ${
          value >= max
            ? "border-muted text-muted-foreground cursor-not-allowed"
            : "border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground active:scale-95"
        }`}
        type="button"
      >
        <Plus size={16} strokeWidth={2} className="sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  )
}
