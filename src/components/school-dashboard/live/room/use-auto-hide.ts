"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"

import { CONTROLS_HIDE_DELAY } from "@/components/lumos/shared/video-player/constants"

/**
 * The player's rule for its chrome: it shows on a touch and leaves on its own
 * after three seconds of nothing, so the picture is what stays on screen.
 *
 * `pinned` holds it up regardless — a menu that is open, the side panel, a
 * control that has keyboard focus. Unpinning starts the clock again rather
 * than hiding at once, so closing a menu does not snatch the row away from
 * under the finger that closed it.
 *
 * Same delay as the lesson player (`CONTROLS_HIDE_DELAY`), imported rather
 * than restated: the two are meant to feel like one player.
 */
export function useAutoHide(pinned: boolean) {
  const [visible, setVisible] = useState(true)
  const visibleRef = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const arm = useCallback(() => {
    clear()
    if (pinned) return
    timer.current = setTimeout(() => {
      visibleRef.current = false
      setVisible(false)
    }, CONTROLS_HIDE_DELAY)
  }, [clear, pinned])

  /** Any activity on the chrome: show it, and start the clock over. Cheap
   *  enough to hang off `pointermove` — while it is already showing this is
   *  a timer reset and no render. */
  const poke = useCallback(() => {
    if (!visibleRef.current) {
      visibleRef.current = true
      setVisible(true)
    }
    arm()
  }, [arm])

  /** The stage itself was tapped: hide a showing row, show a hidden one. */
  const toggle = useCallback(() => {
    if (visibleRef.current) {
      clear()
      visibleRef.current = false
      setVisible(false)
    } else {
      poke()
    }
  }, [clear, poke])

  // Pinning only governs the TIMER; what a pin shows is derived below, so
  // the effect never sets state. A pin that lands on faded chrome (keyboard
  // focus reaching a hidden control) shows it for exactly as long as it holds.
  useEffect(() => {
    if (pinned) clear()
    else arm()
    return clear
  }, [pinned, arm, clear])

  return { visible: pinned || visible, poke, toggle }
}
