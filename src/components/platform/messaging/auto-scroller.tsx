"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react"

export interface AutoScrollerProps {
  children: ReactNode
  /**
   * Whether auto-scroll is enabled
   * @default true
   */
  enabled?: boolean
  /**
   * Scroll behavior (smooth or instant)
   * @default "smooth"
   */
  behavior?: ScrollBehavior
  /**
   * Additional className for the container
   */
  className?: string
  /**
   * Callback when scroll reaches bottom
   */
  onScrollToBottom?: () => void
  /**
   * Callback when scroll reaches top
   */
  onScrollToTop?: () => void
}

/**
 * AutoScroller component that automatically scrolls to bottom when new content appears
 *
 * Uses MutationObserver to detect DOM changes (new messages) and automatically
 * scrolls to the bottom with smooth animation.
 *
 * **Pattern from Next.js 15 Message Box**:
 * - Event-driven (triggers on DOM changes, not data dependencies)
 * - No dependency on data array length
 * - Smooth scroll animation via browser API
 * - Efficient (native browser API, minimal overhead)
 * - Clean cleanup on unmount
 *
 * @example
 * ```tsx
 * <AutoScroller>
 *   {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
 * </AutoScroller>
 * ```
 */
export const AutoScroller = forwardRef<HTMLDivElement, AutoScrollerProps>(
  function AutoScrollerComponent(
    {
      children,
      enabled = true,
      behavior = "smooth",
      className,
      onScrollToBottom,
      onScrollToTop,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const isUserScrolling = useRef(false)
    const scrollTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

    // Expose the container ref to parent
    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement, [])

    // Auto-scroll to bottom on new content
    useEffect(() => {
      if (!enabled) return

      const element = containerRef.current
      if (!element) return

      // Create MutationObserver to watch for DOM changes
      const observer = new MutationObserver(() => {
        // Only auto-scroll if user is not manually scrolling
        if (!isUserScrolling.current) {
          element.scroll({
            top: element.scrollHeight,
            behavior,
          })
        }
      })

      // Observe changes to child list (new messages added)
      observer.observe(element, {
        childList: true,
        subtree: true,
      })

      // Initial scroll to bottom
      element.scroll({
        top: element.scrollHeight,
        behavior: "instant",
      })

      return () => observer.disconnect()
    }, [enabled, behavior])

    // Detect user scrolling
    useEffect(() => {
      const element = containerRef.current
      if (!element) return

      const handleScroll = () => {
        // Set user scrolling flag
        isUserScrolling.current = true

        // Clear existing timeout
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current)
        }

        // Reset flag after user stops scrolling
        scrollTimeout.current = setTimeout(() => {
          isUserScrolling.current = false
        }, 150)

        // Check if at bottom
        const isAtBottom =
          Math.abs(
            element.scrollHeight - element.scrollTop - element.clientHeight
          ) < 10

        if (isAtBottom) {
          onScrollToBottom?.()
        }

        // Check if at top
        const isAtTop = element.scrollTop < 10

        if (isAtTop) {
          onScrollToTop?.()
        }
      }

      element.addEventListener("scroll", handleScroll, { passive: true })

      return () => {
        element.removeEventListener("scroll", handleScroll)
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current)
        }
      }
    }, [onScrollToBottom, onScrollToTop])

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          scrollBehavior: (behavior as any) || undefined,
        }}
      >
        {children}
      </div>
    )
  }
)

/**
 * Hook to programmatically scroll to bottom
 *
 * @example
 * ```tsx
 * const scrollToBottom = useScrollToBottom(containerRef)
 *
 * return (
 *   <>
 *     <div ref={containerRef}>...</div>
 *     <button onClick={scrollToBottom}>Scroll to Bottom</button>
 *   </>
 * )
 * ```
 */
export function useScrollToBottom(
  containerRef: React.RefObject<HTMLDivElement>,
  behavior: ScrollBehavior = "smooth"
) {
  return () => {
    const element = containerRef.current
    if (!element) return

    element.scroll({
      top: element.scrollHeight,
      behavior,
    })
  }
}

/**
 * Hook to detect if user is at bottom of scroll container
 *
 * @example
 * ```tsx
 * const isAtBottom = useIsAtBottom(containerRef)
 *
 * return (
 *   <>
 *     <div ref={containerRef}>...</div>
 *     {!isAtBottom && (
 *       <button onClick={scrollToBottom}>New messages ↓</button>
 *     )}
 *   </>
 * )
 * ```
 */
export function useIsAtBottom(
  containerRef: React.RefObject<HTMLDivElement>,
  threshold = 100
): boolean {
  const [isAtBottom, setIsAtBottom] = useState(true)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const handleScroll = () => {
      const scrolledFromBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight
      setIsAtBottom(scrolledFromBottom < threshold)
    }

    element.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => element.removeEventListener("scroll", handleScroll)
  }, [containerRef, threshold])

  return isAtBottom
}
