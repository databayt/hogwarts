// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useEffect } from "react"

import { useCaptureDeterrents } from "./use-capture-deterrents"

/**
 * Client-side video protection hook.
 *
 * Read this before adding to it: **none of these layers are security.** The
 * real protection is server-side — the browser is handed an opaque
 * `/api/lumos/video/<id>` reference, that route re-authorizes on every
 * request (and refuses to be opened as a page), and the storage object is not
 * readable without a signed URL (see `video/media-access.ts`). Anyone
 * determined enough to open devtools can still capture what they are
 * authorized to watch, and no browser API changes that.
 *
 * What these layers do buy:
 * - they stop the *accidental* and the *casual* save (right-click → Save
 *   video as, Ctrl+S, drag-to-desktop), which is how most copies actually
 *   escape — that half lives in `useCaptureDeterrents`
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
 * which requires DRM-packaged HLS/DASH and a license server — or a native
 * app shell (Android `FLAG_SECURE`). Not available from a plain <video src>.
 */
export function useVideoProtection({
  containerRef,
  videoRef,
  enabled = true,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  enabled?: boolean
}): void {
  useCaptureDeterrents({ containerRef, enabled })

  useEffect(() => {
    if (!enabled) return
    const video = videoRef.current
    if (!video) return

    // A hidden tab keeps decoding into a surface the page cannot watermark
    // (screen-recording a backgrounded window, the OS thumbnail switcher).
    // Pause while hidden; the viewer presses play again.
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && !video.paused) video.pause()
    }

    // PiP pops the bare <video> out of the page, leaving the watermark overlay
    // behind. `disablePictureInPicture` covers the browser's own affordances,
    // but a script can still call requestPictureInPicture(), so anything that
    // gets in is evicted.
    const onEnterPip = () => {
      if (document.pictureInPictureElement) {
        void document.exitPictureInPicture().catch(() => {})
      }
    }

    video.setAttribute("controlsList", "nodownload")
    video.setAttribute("disableRemotePlayback", "")
    video.setAttribute("disablePictureInPicture", "")
    video.disablePictureInPicture = true

    document.addEventListener("visibilitychange", onVisibility)
    video.addEventListener("enterpictureinpicture", onEnterPip)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      video.removeEventListener("enterpictureinpicture", onEnterPip)
    }
  }, [enabled, videoRef])
}
