// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useEffect, useRef } from "react"

/** Marks the history entry this guard pushed. */
export const BACK_GUARD_MARK = "__liveRoomGuard"

/**
 * One press of Android's system Back (or an edge swipe) used to leave the
 * room for the previous page. While `active` — the reader is inside the
 * connected room — one marker entry sits on top of the history; a Back pops
 * it, the guard pushes it again and asks `onBack` to confirm. When `active`
 * turns false (any leave path, the room ending) or the component unmounts,
 * the listener is removed and nothing is pushed again, so Back is normal.
 *
 * The existing history state is spread into the marker: the App Router
 * reloads the page on a popstate whose state it did not write.
 */
export function useBackGuard(active: boolean, onBack: () => void) {
  const cb = useRef(onBack)
  useEffect(() => {
    cb.current = onBack
  })

  useEffect(() => {
    if (!active) return
    const push = () =>
      window.history.pushState(
        { ...(window.history.state ?? {}), [BACK_GUARD_MARK]: true },
        "",
        window.location.href
      )
    push()
    const onPop = () => {
      push()
      cb.current()
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [active])
}
