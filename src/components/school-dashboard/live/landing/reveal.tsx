// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A scroll reveal for the one band that earns it.
 *
 * Deliberately thin: it takes `children` so everything inside stays a server
 * component and never hydrates — only this wrapper does.
 *
 * Deliberately rare, too. The marketing homepage reveals every band, which
 * reads well on a page you see once. This page is opened several times a
 * school day, and content that fades in on arrival reads as slow — so the
 * hero, the live strip and the readiness band paint immediately, and only the
 * "not set up yet" band, which an admin sees once and then never again,
 * animates.
 *
 * It animates on MOUNT, not on scroll. The shared `reveal()` helper uses
 * `whileInView`, which is right on a marketing page where every band is below
 * the fold — but this band is the FIRST thing an admin of a not-yet-online
 * school needs to read, and a `whileInView` element that never enters the
 * viewport stays at `opacity: 0.001` forever. Caught exactly that way: the
 * band rendered, occupied its full height, and showed nothing.
 *
 * Plain CSS (tw-animate-css), not framer-motion: this is the only motion
 * import on the page, and a CSS entrance costs no JS and no hydration — the
 * component is a server component again. The curve is an ease-out that
 * matches the overdamped spring the homepage bands use (`REVEAL_SPRING`: it
 * never overshoots, it settles in about a second), and
 * `motion-reduce:animate-none` honours the OS setting.
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none">
      {children}
    </div>
  )
}
