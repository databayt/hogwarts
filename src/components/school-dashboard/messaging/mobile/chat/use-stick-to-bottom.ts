"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

/**
 * Within this many pixels of the bottom the reader counts as "at the
 * bottom": arrivals scroll into view and the jump button stays hidden.
 */
const NEAR_BOTTOM_PX = 80

/**
 * Older messages are requested when the reader is within this many
 * viewport-heights of the top — early enough that the page is usually in
 * before they get there, so the spinner is rarely seen.
 */
const PREFETCH_VIEWPORTS = 1.5

/** The least a thread item needs for the scroller to reason about it. */
export type StickItem = { id: string; kind?: string; side?: "me" | "other" }

const isOwn = (item: StickItem | undefined) =>
  !!item && item.kind !== "date" && item.side === "me"
const isOther = (item: StickItem) =>
  item.kind !== "date" && item.side === "other"

/**
 * WhatsApp's scroll contract for a thread, shared by the /messages phone view
 * and the live-class chat:
 *
 * - opens at the newest message;
 * - follows arrivals only when the reader is at the bottom, or the arrival is
 *   their own — a reader up in the history keeps their place and gets the
 *   jump button with a count instead;
 * - holds the reader's place when older messages are prepended;
 * - stays pinned through late height changes (images, composer, keyboard);
 * - prefetches older pages before the reader reaches the top.
 *
 * `active` lets a hidden thread (a side-panel tab kept mounted) skip pinning
 * while it has no layout, and re-pin when it is shown again.
 */
export function useStickToBottom<T extends StickItem>({
  items,
  hasMore,
  onLoadMore,
  active = true,
}: {
  items: T[]
  hasMore?: boolean
  onLoadMore?: () => void | Promise<void>
  active?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Read on every scroll, written to state only when the answer flips, so a
  // flick does not re-render the thread sixty times a second.
  const nearBottomRef = useRef(true)
  const [showJump, setShowJump] = useState(false)
  const [unseen, setUnseen] = useState(0)

  // Set right before older messages are requested; consumed by the layout
  // effect that puts the reader back where they were once they arrive.
  const prependRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(
    null
  )
  const [loadingOlder, setLoadingOlder] = useState(false)
  const loadingRef = useRef(false)

  const prevItemsRef = useRef<T[]>(items)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current
    if (!el) return
    if (behavior === "smooth") {
      el.scrollTo({ top: el.scrollHeight, behavior })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  // Open at the newest message, as WhatsApp does — and again each time a
  // hidden thread is shown, if the reader had been at the bottom.
  useLayoutEffect(() => {
    if (active && nearBottomRef.current) scrollToBottom()
  }, [active, scrollToBottom])

  // Where to put the reader after the thread changed underneath them.
  useLayoutEffect(() => {
    const el = scrollRef.current
    const prev = prevItemsRef.current
    prevItemsRef.current = items
    if (!el || prev === items) return

    const pending = prependRef.current
    const grewAtTop =
      prev.length > 0 &&
      items.length > prev.length &&
      items[0]?.id !== prev[0]?.id &&
      items[items.length - 1]?.id === prev[prev.length - 1]?.id

    if (pending && grewAtTop) {
      // Older messages were prepended: hold the reader's place. The delta is
      // measured, not estimated, and iOS has no `overflow-anchor` to do it.
      prependRef.current = null
      el.scrollTop = pending.scrollTop + (el.scrollHeight - pending.scrollHeight)
      return
    }
    prependRef.current = null

    // Only a longer list is an arrival. A temp row becoming its persisted
    // twin keeps the length, and must not move a reader who scrolled up in
    // the second after sending.
    if (items.length <= prev.length) return
    const prevIds = new Set(prev.map((i) => i.id))
    const fresh = items.filter((i) => !prevIds.has(i.id))
    if (fresh.length === 0) return

    if (nearBottomRef.current || fresh.some(isOwn)) {
      nearBottomRef.current = true
      scrollToBottom()
      return
    }
    const others = fresh.filter(isOther).length
    if (others > 0) setUnseen((n) => n + others)
  }, [items, scrollToBottom])

  // Heights change after commit — images decode, the composer grows, the
  // keyboard shrinks the viewport. Stay pinned to the bottom through all of
  // it, but only while the reader was at the bottom to begin with.
  useEffect(() => {
    const el = scrollRef.current
    const content = contentRef.current
    if (!el || !content || !active || typeof ResizeObserver === "undefined")
      return
    const observer = new ResizeObserver(() => {
      if (nearBottomRef.current) scrollToBottom()
    })
    observer.observe(content)
    observer.observe(el)
    return () => observer.disconnect()
  }, [scrollToBottom, active])

  const requestOlder = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasMore || !onLoadMore || loadingRef.current) return
    loadingRef.current = true
    setLoadingOlder(true)
    prependRef.current = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight }
    Promise.resolve(onLoadMore()).finally(() => {
      loadingRef.current = false
      setLoadingOlder(false)
    })
  }, [hasMore, onLoadMore])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    // A `display: none` scroller reports zeros — not a real position.
    if (!el || !el.clientHeight) return
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const near = fromBottom < NEAR_BOTTOM_PX
    if (near !== nearBottomRef.current) {
      nearBottomRef.current = near
      setShowJump(!near && el.scrollHeight > el.clientHeight + NEAR_BOTTOM_PX)
      if (near) setUnseen(0)
    }
    if (el.scrollTop < el.clientHeight * PREFETCH_VIEWPORTS) requestOlder()
  }, [requestOlder])

  const jumpToBottom = useCallback(() => {
    setUnseen(0)
    scrollToBottom("smooth")
  }, [scrollToBottom])

  return {
    scrollRef,
    contentRef,
    handleScroll,
    showJump,
    unseen,
    jumpToBottom,
    loadingOlder,
  }
}
