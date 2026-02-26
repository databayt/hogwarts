// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import * as React from "react"

import { useCallbackRef } from "./use-callback-ref"

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
) {
  const handleCallback = useCallbackRef(callback)
  const debounceTimerRef = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(debounceTimerRef.current), [])

  const setValue = React.useCallback(
    (...args: Parameters<T>) => {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = window.setTimeout(
        () => handleCallback(...args),
        delay
      )
    },
    [handleCallback, delay]
  )

  return setValue
}
