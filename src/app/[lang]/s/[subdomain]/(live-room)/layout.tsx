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
  return <div className="h-screen w-screen overflow-hidden">{children}</div>
}
