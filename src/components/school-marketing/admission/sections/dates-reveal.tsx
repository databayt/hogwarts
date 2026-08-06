"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

/**
 * Drives the timeline's staggered reveal (see `.zenda-tl-*` in
 * school-marketing.css).
 *
 * Deliberately an IntersectionObserver and CSS, not the reference's
 * GSAP/ScrollTrigger timeline. Zenda animates the pill by tweening `left`/
 * `right`, which is physically-directional and would run backwards in Arabic;
 * transitioning `width` against an end-anchored pill gives the same sweep and
 * mirrors for free.
 *
 * The list ships SETTLED from the server and this hides it on mount, rather
 * than the other way round. It matters on a public page: if the bundle never
 * executes, the dates are still readable -- there is no state in which a
 * JS failure leaves a section blank, so no failsafe timer is needed. (A timer
 * would also be actively wrong here: this is the sixth section, so any
 * failsafe short enough to matter fires before the reader has scrolled to it
 * and the animation plays to an empty screen.)
 *
 * If the list has ALREADY CROSSED the trigger line at mount -- deep link,
 * restored scroll position, a reader who got here before hydration finished --
 * it is left settled rather than hidden and immediately shown again. The test
 * is the trigger line (60% of the viewport, matching the observer below), not
 * mere visibility: a list peeking in at the bottom of the screen has not been
 * read yet and must still animate. Testing against the full viewport height
 * bailed on that case and was a silent no-motion path.
 *
 * NOTE: no `armed` ref. One used to guard this effect, and under StrictMode's
 * mount/cleanup/mount it stranded the section: the first pass set `pending` and
 * the cleanup disconnected the observer, then the second pass saw `armed` and
 * returned -- leaving the rows hidden with nothing left alive to reveal them.
 * The effect is idempotent instead, and the cleanup undoes its own state.
 */
export function DatesReveal({ targetId }: { targetId: string }) {
  useEffect(() => {
    const list = document.getElementById(targetId)
    if (!list) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (!("IntersectionObserver" in window)) return

    const box = list.getBoundingClientRect()
    if (box.top < window.innerHeight * 0.6) return

    list.dataset.reveal = "pending"

    // zenda's ScrollTrigger fires at `start: "top 60%"` -- when the top of the
    // list crosses 60% of the viewport height. Shrinking the root's bottom edge
    // by 40% puts the intersection boundary on exactly that line, which a
    // `threshold` cannot express: a threshold is a fraction of the ELEMENT, so
    // it moves with the list's height and fired early on this four-row list.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        list.dataset.reveal = "done"
        io.disconnect()
      },
      { rootMargin: "0px 0px -40% 0px", threshold: 0 }
    )
    io.observe(list)

    // Restore the settled state on teardown. Under StrictMode this runs between
    // the two mounts, and the second re-hides within the same task, so nothing
    // paints in between; on a real unmount it means the rows are never left
    // stranded at `pending` with no observer alive to finish them.
    return () => {
      io.disconnect()
      if (list.dataset.reveal === "pending") delete list.dataset.reveal
    }
  }, [targetId])

  return null
}
