// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Bare full-viewport layout for live-class rooms. No sidebar, no chrome —
// the SFU stream owns the screen.

export default function LiveRoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="h-screen w-screen overflow-hidden">{children}</div>
}
