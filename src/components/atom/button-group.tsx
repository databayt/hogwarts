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
  /** Labels for i18n (optional, English defaults) */
  dictionary?: {
    submit?: string
    cancel?: string
    loading?: string
  }
}

export function ButtonGroup({
  primaryLabel,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
  primaryVariant = "default",
  secondaryVariant = "ghost",
  size = "sm",
  className,
  disabled,
  loading,
  dictionary,
}: ButtonGroupProps) {
  const submitText = primaryLabel ?? dictionary?.submit ?? "Submit"
  const cancelText = secondaryLabel ?? dictionary?.cancel ?? "Cancel"
  const loadingText = dictionary?.loading ?? "Loading..."
  return (
    <div className={cn("flex gap-2", className)} data-slot="button-group">
      <Button
        variant={secondaryVariant}
        size={size}
        onClick={onSecondaryClick}
        disabled={disabled || loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={primaryVariant}
        size={size}
        onClick={onPrimaryClick}
        disabled={disabled || loading}
      >
        {loading ? loadingText : submitText}
      </Button>
    </div>
  )
}
