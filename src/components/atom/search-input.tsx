"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Debounced search input with icon
 * Follows shadcn/ui patterns
 */
interface SearchInputProps {
  /** Current search value */
  value: string
  /** Change handler */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number
  /** Show clear button when value is present */
  showClear?: boolean
  /** Additional class names */
  className?: string
  /** Input size */
  size?: "sm" | "default" | "lg"
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  showClear = true,
  className,
  size = "default",
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  // Sync external value changes
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setLocalValue(newValue)

      // Debounce the onChange callback
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        onChange(newValue)
      }, debounceMs)
    },
    [onChange, debounceMs]
  )

  const handleClear = React.useCallback(() => {
    setLocalValue("")
    onChange("")
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [onChange])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const sizeClasses = {
    sm: "h-8 w-32 lg:w-40",
    default: "h-9 w-40 lg:w-56",
    lg: "h-10 w-48 lg:w-64",
  }

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2",
          iconSizes[size]
        )}
      />
      <Input
        type="search"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className={cn(
          "pl-8",
          showClear && localValue && "pr-8",
          sizeClasses[size]
        )}
      />
      {showClear && localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 hover:bg-transparent"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
