// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useEffect } from "react"

/**
 * The container-level half of capture deterrence — everything that does not
 * need a single `<video>` element. `useVideoProtection` composes it for the
 * players; the live room mounts it directly, because its stage holds one
 * LiveKit tile per camera and there is no one element to hand over.
 *
 * None of this is security (see `use-video-protection.ts`). It closes the
 * one-keystroke save paths and blanks the frame after PrintScreen.
 *
 * The blank is `[data-capture-blank] video { visibility: hidden }`, declared
 * once in `src/app/globals.css` so every surface using this hook gets it.
 */
export function useCaptureDeterrents({
  containerRef,
  enabled = true,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  enabled?: boolean
}): void {
  useEffect(() => {
    if (!enabled) return
    const container = containerRef.current

    // Right-click → "Save video as" / "Copy video address".
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === "VIDEO" ||
        target.closest("[data-video-protected]")
      ) {
        e.preventDefault()
      }
    }

    // Save page, view source (reveals media URLs), print (rasterises the frame).
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key === "s" || key === "u" || key === "p") e.preventDefault()
    }

    // PrintScreen (Windows/Linux) arrives on keyUP only, after the OS has
    // captured. Replace the clipboard image with nothing and black the media
    // for a moment, so "PrtScn → paste" yields an empty frame. macOS capture
    // shortcuts never reach the page; the watermark covers those.
    let blankTimer: ReturnType<typeof setTimeout> | null = null
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "PrintScreen") return
      void navigator.clipboard?.writeText("").catch(() => {})
      if (!container) return
      container.setAttribute("data-capture-blank", "")
      if (blankTimer) clearTimeout(blankTimer)
      blankTimer = setTimeout(
        () => container.removeAttribute("data-capture-blank"),
        1500
      )
    }

    const onDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "VIDEO" || target.tagName === "IMG") {
        e.preventDefault()
      }
    }

    container?.addEventListener("contextmenu", onContextMenu)
    container?.addEventListener("dragstart", onDragStart)
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("keyup", onKeyUp)

    return () => {
      container?.removeEventListener("contextmenu", onContextMenu)
      container?.removeEventListener("dragstart", onDragStart)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("keyup", onKeyUp)
      if (blankTimer) clearTimeout(blankTimer)
      container?.removeAttribute("data-capture-blank")
    }
  }, [enabled, containerRef])
}
