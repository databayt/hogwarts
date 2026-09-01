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
  // `h-dvh`, not `h-screen`: on a phone `100vh` is taller than what you can
  // see while the address bar is showing, which pushed the room's control bar
  // off the bottom of the screen. `w-full` rather than `w-screen` for the
  // matching reason — `100vw` includes the scrollbar and overflows the page.
  return <div className="h-dvh w-full overflow-hidden">{children}</div>
}
