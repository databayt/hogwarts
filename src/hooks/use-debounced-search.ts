import { useState } from "react"

import { useDebouncedCallback } from "@/components/table/use-debounced-callback"

/**
 * Returns [displayValue, debouncedValue, setDisplayValue]
 * displayValue → bind to PlatformToolbar.searchValue (instant UI update)
 * debouncedValue → bind to usePlatformData filters (delayed server fetch)
 */
export function useDebouncedSearch(
  delay = 300
): [string, string, (value: string) => void] {
  const [displayValue, setDisplayValue] = useState("")
  const [debouncedValue, setDebouncedValue] = useState("")

  const setDebouncedValueDelayed = useDebouncedCallback(
    (value: string) => setDebouncedValue(value),
    delay
  )

  const setValue = (value: string) => {
    setDisplayValue(value)
    setDebouncedValueDelayed(value)
  }

  return [displayValue, debouncedValue, setValue]
}
