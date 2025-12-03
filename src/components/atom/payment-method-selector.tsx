// @ts-nocheck
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/atom/icons"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const methodIcons = {
  card: Icons.creditCard,
  paypal: Icons.paypal,
  apple: Icons.apple,
} as const

export type PaymentMethod = keyof typeof methodIcons

export interface PaymentMethodSelectorProps extends React.ComponentProps<"div"> {
  value?: PaymentMethod
  onValueChange?: (value: PaymentMethod) => void
  methods?: PaymentMethod[]
}

export function PaymentMethodSelector({
  value = "card",
  onValueChange,
  methods = ["card", "paypal", "apple"],
  className,
  ...props
}: PaymentMethodSelectorProps) {
  return (
    <div data-slot="payment-method-selector" className={className} {...props}>
      <RadioGroup
        value={value}
        onValueChange={(v) => onValueChange?.(v as PaymentMethod)}
        className="grid grid-cols-3 gap-4"
      >
        {methods.map((method) => {
          const Icon = methodIcons[method]
          const label = method.charAt(0).toUpperCase() + method.slice(1)
          return (
            <div key={method}>
              <RadioGroupItem
                value={method}
                id={method}
                className="peer sr-only"
              />
              <Label
                htmlFor={method}
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4",
                  "hover:bg-accent hover:text-accent-foreground",
                  "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                )}
              >
                <Icon className="mb-3 size-6" />
                {label}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}
