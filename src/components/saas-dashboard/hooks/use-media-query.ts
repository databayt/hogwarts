// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useEffect, useState } from "react"

export function useMediaQuery() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)")
    setIsOpen(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setIsOpen(e.matches)
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return { isOpen }
}
