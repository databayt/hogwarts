"use client"

import { Minus, Plus } from 'lucide-react'

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
  step = 1
}: CounterProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={onDecrement}
        disabled={value <= min}
        className={`w-10 h-10 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center transition-colors min-h-[40px] sm:min-h-[28px] ${
          value <= min
            ? 'border-muted text-muted-foreground cursor-not-allowed'
            : 'border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground active:scale-95'
        }`}
        type="button"
      >
        <Minus size={16} strokeWidth={2} className="sm:w-3.5 sm:h-3.5" />
      </button>
      <span className="w-8 sm:w-2.5 text-center">
        {value}
      </span>
      <button
        onClick={onIncrement}
        disabled={value >= max}
        className={`w-10 h-10 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center transition-colors min-h-[40px] sm:min-h-[28px] ${
          value >= max
            ? 'border-muted text-muted-foreground cursor-not-allowed'
            : 'border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground active:scale-95'
        }`}
        type="button"
      >
        <Plus size={16} strokeWidth={2} className="sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  )
}

