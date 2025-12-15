"use client"

import { useEffect, useState } from "react"
import { LayoutGrid, List } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type ViewMode = "list" | "grid"

export interface ViewToggleProps {
  /** Current view mode */
  value?: ViewMode
  /** Callback when view mode changes */
  onChange?: (mode: ViewMode) => void
  /** Storage key for persisting preference */
  storageKey?: string
  /** Default view mode */
  defaultValue?: ViewMode
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon"
  /** Additional class names */
  className?: string
  /** Show tooltip */
  showTooltip?: boolean
}

export function ViewToggle({
  value: controlledValue,
  onChange,
  storageKey = "view-mode-preference",
  defaultValue = "list",
  size = "icon",
  className,
  showTooltip = true,
}: ViewToggleProps) {
  // Use controlled or uncontrolled mode
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState<ViewMode>(() => {
    if (isControlled) return controlledValue

    // Try to get from localStorage if not controlled
    if (typeof window !== "undefined" && storageKey) {
      const stored = localStorage.getItem(storageKey)
      if (stored === "list" || stored === "grid") {
        return stored
      }
    }
    return defaultValue
  })

  const currentValue = isControlled ? controlledValue : internalValue

  // Sync with localStorage when value changes
  useEffect(() => {
    if (!isControlled && storageKey && typeof window !== "undefined") {
      localStorage.setItem(storageKey, currentValue)
    }
  }, [currentValue, isControlled, storageKey])

  const handleToggle = () => {
    const newMode = currentValue === "list" ? "grid" : "list"

    if (!isControlled) {
      setInternalValue(newMode)
    }

    onChange?.(newMode)
  }

  const Icon = currentValue === "list" ? LayoutGrid : List
  const tooltipText =
    currentValue === "list" ? "Switch to grid view" : "Switch to list view"

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      className={cn("transition-all", className)}
      title={showTooltip ? tooltipText : undefined}
      aria-label={tooltipText}
    >
      <Icon
        className={cn(
          "transition-all duration-200",
          size === "icon" ? "h-4 w-4" : "h-4 w-4"
        )}
      />
      {size !== "icon" && (
        <span className="ms-2">
          {currentValue === "list" ? "Grid" : "List"}
        </span>
      )}
    </Button>
  )
}
