"use client"

import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  className,
}: NumberStepperProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10)
    if (!isNaN(v) && v >= min && v <= max) onChange(v)
  }

  return (
    <ButtonGroup className={className}>
      <Input
        value={value}
        onChange={handleInputChange}
        className="h-8 w-14 font-mono"
        maxLength={3}
      />
      <Button
        variant="outline"
        size="icon-sm"
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label="Decrement"
      >
        <Minus />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label="Increment"
      >
        <Plus />
      </Button>
    </ButtonGroup>
  )
}
