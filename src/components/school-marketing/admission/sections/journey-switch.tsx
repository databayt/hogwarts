"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

/**
 * Flags the step crossing the viewport centre -- and its paired panel --
 * `is-active` (see `.adm-jrn_*` in school-marketing.css).
 *
 * The reference builds one GSAP ScrollTrigger per block at
 * `start: "top center", end: "bottom center"` and repaints the classes on
 * every `onUpdate`. That is a plain "does this element straddle the centre
 * line" test, which an IntersectionObserver expresses natively: collapsing the
 * root to a zero-height band at 50% puts the boundary exactly on the centre.
 * It fires on crossings rather than on every scroll frame, needs no library,
 * and -- unlike a `threshold`, which is a fraction of the ELEMENT -- does not
 * move with how tall a step happens to be after translation.
 *
 * Like the reference, this only ever MOVES the active flag, never clears it:
 * before the first step reaches the centre and after the last leaves it, no
 * step straddles the line, and the column must keep showing the nearest one
 * rather than going blank. Step 0 ships active from the server for the same
 * reason.
 *
 * Below 768px there is no switcher -- every panel is visible and stacked (the
 * reference's `if (window.innerWidth > 767)`), so the observer would be
 * flagging classes nothing reads. It is bound to a media query instead of
 * checked once, or a desktop reader who started narrow never gets it.
 */
export function JourneySwitch({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId)
    if (!root) return
    if (!("IntersectionObserver" in window)) return

    const steps = [...root.querySelectorAll<HTMLElement>("[data-jrn-step]")]
    const panels = [...root.querySelectorAll<HTMLElement>("[data-jrn-panel]")]
    if (!steps.length) return

    const desktop = window.matchMedia("(min-width: 768px)")
    let io: IntersectionObserver | null = null

    const activate = (index: number) => {
      steps.forEach((el, i) => el.classList.toggle("is-active", i === index))
      panels.forEach((el, i) => el.classList.toggle("is-active", i === index))
    }

    const attach = () => {
      if (io) return
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const index = Number(
              (entry.target as HTMLElement).dataset.jrnStep ?? -1
            )
            if (index >= 0) activate(index)
          }
        },
        { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
      )
      steps.forEach((el) => io!.observe(el))
    }

    const detach = () => {
      io?.disconnect()
      io = null
      // Hand the column back to its server-rendered state, or a resize down to
      // mobile would leave whichever step was last active flagged -- harmless
      // there today, but only because mobile ignores the class.
      activate(0)
    }

    const sync = () => (desktop.matches ? attach() : detach())
    sync()
    desktop.addEventListener("change", sync)

    return () => {
      desktop.removeEventListener("change", sync)
      io?.disconnect()
      io = null
    }
  }, [rootId])

  return null
}
