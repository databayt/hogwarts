"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  Banknote,
  Building2,
  CreditCard,
  Loader2,
  Smartphone,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

const ICON_MAP: Record<string, React.ElementType> = {
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
}

interface PaymentMethodCardProps {
  iconName: string
  label: string
  description: string
  isLoading: boolean
  disabled: boolean
  onClick: () => void
}

export function PaymentMethodCard({
  iconName,
  label,
  description,
  isLoading,
  disabled,
  onClick,
}: PaymentMethodCardProps) {
  const Icon = ICON_MAP[iconName] ?? CreditCard

  return (
    <Card
      className="hover:border-primary cursor-pointer transition-colors"
      onClick={() => !disabled && onClick()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-primary h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{label}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {isLoading && <Loader2 className="text-primary h-5 w-5 animate-spin" />}
      </CardContent>
    </Card>
  )
}
