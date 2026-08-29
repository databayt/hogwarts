// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback, useEffect } from "react"

/**
 * Client-side video protection hook.
 *
 * Read this before adding to it: **none of these layers are security.** The
 * real protection is server-side — the browser is handed an opaque
 * `/api/lumos/video/<id>` reference, that route re-authorizes on every
 * request, and the storage object is not readable without a signed URL (see
 * `video/media-access.ts`). Anyone determined enough to open devtools can
 * still capture what they are authorized to watch, and no browser API changes
 * that.
 *
 * What these layers do buy:
 * - they stop the *accidental* and the *casual* save (right-click → Save
 *   video as, Ctrl+S, drag-to-desktop), which is how most copies actually
 *   escape
 * - they close the paths that would strip the forensic watermark, which is
 *   the one mechanism that survives screen recording
 *
 * That second point is the load-bearing one. Picture-in-Picture and remote
 * playback (Chromecast/AirPlay) render the <video> element on its own,
 * *without* the sibling overlay that carries the watermark — so on protected
 * content they are disabled outright, not merely hidden. A visible-but-
 * reachable PiP button was a clean, watermark-free capture path.
 *
 * True screenshot prevention needs EME/DRM (Widevine/PlayReady/FairPlay),
 * which requires DRM-packaged HLS/DASH and a license server. Not available
 * from a plain <video src>.
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

  // 4. Picture-in-Picture escape hatch.
  //
  // PiP pops the bare <video> out of the page, leaving the watermark overlay
  // behind — a clean capture surface. `disablePictureInPicture` covers the
  // browser's own affordances, but a script (or a stale UI button) can still
  // call requestPictureInPicture(), so anything that gets in is evicted.
  const handleEnterPip = useCallback(() => {
    if (!enabled) return
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture().catch(() => {
        /* already gone, or the browser refused — nothing to recover */
      })
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    const video = videoRef.current

    // Attach listeners
    container?.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    container?.addEventListener("dragstart", handleDragStart)
    video?.addEventListener("enterpictureinpicture", handleEnterPip)

    // 5. Native element-level protection
    if (video) {
      // Hide download + playback-rate items in native controls
      video.setAttribute("controlsList", "nodownload")
      // Kill the casting paths — they render the video without our overlay
      video.setAttribute("disableRemotePlayback", "")
      video.setAttribute("disablePictureInPicture", "")
      video.disablePictureInPicture = true
    }

    return () => {
      container?.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      container?.removeEventListener("dragstart", handleDragStart)
      video?.removeEventListener("enterpictureinpicture", handleEnterPip)
    }
  }, [
    enabled,
    containerRef,
    videoRef,
    handleContextMenu,
    handleKeyDown,
    handleDragStart,
    handleEnterPip,
  ])
}
