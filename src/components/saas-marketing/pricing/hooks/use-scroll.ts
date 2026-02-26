// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback, useEffect, useState } from "react"

export function useScroll(threshold: number) {
  const [scrolled, setScrolled] = useState(false)

  const onScroll = useCallback(() => {
    setScrolled(window.pageYOffset > threshold)
  }, [threshold])

  useEffect(() => {
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [onScroll])

  return scrolled
}
