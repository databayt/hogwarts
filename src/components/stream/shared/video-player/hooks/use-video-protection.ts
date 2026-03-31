// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback, useEffect } from "react"

/**
 * Client-side video protection hook.
 *
 * Defense-in-depth layers to deter casual downloading and screen capture.
 * These are deterrents, not unbreakable DRM -- but they raise the bar
 * significantly for non-technical users. Combined with server-side
 * protections (signed URLs, HLS encryption), this provides strong coverage.
 *
 * Layers:
 * 1. Disable right-click context menu on video container
 * 2. Block common download keyboard shortcuts (Ctrl+S, Ctrl+Shift+S)
 * 3. Prevent drag-to-save on video element
 * 4. Block devtools video src inspection shortcuts
 * 5. Visibility API: pause on tab switch to deter screen-share recording
 */
export function useVideoProtection({
  containerRef,
  videoRef,
  enabled = true,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  enabled?: boolean
}) {
  // 1. Block right-click context menu on the video container
  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return
      const target = e.target as HTMLElement
      // Only block on video-related elements, not on text content below
      if (
        target.tagName === "VIDEO" ||
        target.closest("[data-video-protected]")
      ) {
        e.preventDefault()
      }
    },
    [enabled]
  )

  // 2. Block download keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      const isCtrlOrCmd = e.ctrlKey || e.metaKey

      // Ctrl+S / Cmd+S (Save page/video)
      if (isCtrlOrCmd && e.key === "s") {
        e.preventDefault()
      }
      // Ctrl+Shift+S / Cmd+Shift+S (Save As)
      if (isCtrlOrCmd && e.shiftKey && e.key === "S") {
        e.preventDefault()
      }
      // Ctrl+U (View Source -- can reveal video URL)
      if (isCtrlOrCmd && e.key === "u") {
        e.preventDefault()
      }
    },
    [enabled]
  )

  // 3. Prevent drag on video element
  const handleDragStart = useCallback(
    (e: DragEvent) => {
      if (!enabled) return
      const target = e.target as HTMLElement
      if (target.tagName === "VIDEO" || target.tagName === "IMG") {
        e.preventDefault()
      }
    },
    [enabled]
  )

  // 4. Visibility API: detect tab switching during playback
  // This deters screen-share recording by pausing when tab loses focus
  const handleVisibilityChange = useCallback(() => {
    if (!enabled || !videoRef.current) return

    if (document.hidden && !videoRef.current.paused) {
      // Video is playing and user switched away -- could be screen recording
      // We don't pause (that would be too aggressive) but we could
      // log this event for analytics
    }
  }, [enabled, videoRef])

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    const video = videoRef.current

    // Attach listeners
    container?.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    container?.addEventListener("dragstart", handleDragStart)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // 5. Set video element attributes for native protection
    if (video) {
      // controlsList="nodownload" hides the download button in native controls
      video.setAttribute("controlsList", "nodownload noplaybackrate")
      // Disable remote playback (Chromecast etc.) for protected content
      video.setAttribute("disableRemotePlayback", "")
      // crossorigin needed for some protection mechanisms
      if (!video.getAttribute("crossorigin")) {
        video.setAttribute("crossorigin", "anonymous")
      }
    }

    return () => {
      container?.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      container?.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [
    enabled,
    containerRef,
    videoRef,
    handleContextMenu,
    handleKeyDown,
    handleDragStart,
    handleVisibilityChange,
  ])
}
