// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Bare full-viewport layout for live-class rooms. No sidebar, no chrome —
// the SFU stream owns the screen.

// Keep the live-room group out of build-time page-data collection
// (page-data OOM safety); these routes are auth-gated and render on demand.
export const dynamic = "force-dynamic"

export default function LiveRoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // `min-h-dvh`, not `h-dvh` with `overflow-hidden`: the pre-join card is ONE
  // SECTION of a page that scrolls, with more to come below it, so the group
  // must not be locked to the viewport. The in-call view sets its own `h-dvh`,
  // which is what keeps the room itself pinned to the screen.
  //
  // `dvh` rather than `vh`: on a phone `100vh` is taller than what you can see
  // while the address bar is showing, which pushed the room's control bar off
  // the bottom of the screen. `w-screen` is wrong for the matching reason
  // — `100vw` includes the scrollbar and overflows the page — so the width
  // comes from the parent instead, widened by the gutter we cancel below.
  //
  // That gutter: the root layout puts `layout-container` on its wrapper, which
  // is `padding-inline: var(--container-px) !important`. This group is meant
  // to own the whole screen, and on a black room the 32px of page ground was
  // easy to miss; under the pre-join card's full-bleed artwork it reads as a
  // white frame around the picture. Same escape the thmanyah clone and the
  // zenda shell use.
  //
  // `bg-background`, not `bg-black`: the pre-join page follows the theme. Only
  // the HERO CARD is pinned dark (it sits over artwork, in both modes — the
  // reference does the same); the four shelves under it are on the page's own
  // ground, dark text in light mode and light in dark. The in-call view paints
  // its own black stage regardless, so this never reaches the room itself.
  return (
    <div className="bg-background mx-[calc(-1*var(--container-px,0px))] min-h-dvh w-[calc(100%+2*var(--container-px,0px))]">
      {children}
    </div>
  )
}
