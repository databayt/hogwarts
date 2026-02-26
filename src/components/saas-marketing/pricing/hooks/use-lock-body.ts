// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import * as React from "react"

// @see https://usehooks.com/useLockBodyScroll.
export function useLockBody() {
  React.useLayoutEffect((): (() => void) => {
    const originalStyle: string = window.getComputedStyle(
      document.body
    ).overflow
    document.body.style.overflow = "hidden"
    return () => (document.body.style.overflow = originalStyle)
  }, [])
}
