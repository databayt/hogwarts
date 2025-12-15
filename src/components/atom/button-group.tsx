"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

export interface ButtonGroupProps {
  primaryLabel?: string
  secondaryLabel?: string
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
  primaryVariant?: ButtonProps["variant"]
  secondaryVariant?: ButtonProps["variant"]
  size?: ButtonProps["size"]
  className?: string
  disabled?: boolean
  loading?: boolean
}

export function ButtonGroup({
  primaryLabel = "Submit",
  secondaryLabel = "Cancel",
  onPrimaryClick,
  onSecondaryClick,
  primaryVariant = "default",
  secondaryVariant = "ghost",
  size = "sm",
  className,
  disabled,
  loading,
}: ButtonGroupProps) {
  return (
    <div className={cn("flex gap-2", className)} data-slot="button-group">
      <Button
        variant={secondaryVariant}
        size={size}
        onClick={onSecondaryClick}
        disabled={disabled || loading}
      >
        {secondaryLabel}
      </Button>
      <Button
        variant={primaryVariant}
        size={size}
        onClick={onPrimaryClick}
        disabled={disabled || loading}
      >
        {loading ? "Loading..." : primaryLabel}
      </Button>
    </div>
  )
}
