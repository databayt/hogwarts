"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"

/** Within this many pixels of the end counts as "at the bottom". */
const NEAR_PX = 96

/**
 * Chat scrolling as ChatGPT does it (from mkan's agent): new content keeps
 * the view at the bottom only while the reader is already there; scrolled
 * up, they stay put and a ↓ button appears. `trigger` is anything that grows
 * the conversation. While an answer streams the jump is instant — a smooth
 * scroll per streamed piece made the list judder.
 */
export function useStickToBottom(trigger: unknown, streaming: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const [away, setAway] = useState(false)

  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_PX
    atBottom.current = near
    setAway(!near)
  }, [])

  const scrollToBottom = useCallback((smooth = true) => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" })
    atBottom.current = true
    setAway(false)
  }, [])

  // Only the element moves here; the scroll event it fires updates `away`.
  useEffect(() => {
    const el = ref.current
    if (!el || !atBottom.current) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: streaming ? "auto" : "smooth",
    })
  }, [trigger, streaming])

  return { ref, onScroll, away, scrollToBottom }
}
