// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Server→client realtime bridge for transportation. Posts to the Socket.IO
// server's secret-gated /api/emit endpoint (same contract as messaging). Live
// tracking is a progressive enhancement: when the socket server is down the
// clients fall back to polling, so every emit here is best-effort and silent.

import "server-only"

export async function emitTripEvent(
  tripId: string,
  event: "trip:location" | "trip:approaching",
  data: Record<string, unknown>
): Promise<void> {
  try {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
    const emitSecret =
      process.env.EMIT_SECRET || process.env.SOCKET_SECRET || ""
    await fetch(`${socketUrl}/api/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-emit-secret": emitSecret,
      },
      body: JSON.stringify({ room: `trip:${tripId}`, event, data }),
    })
  } catch {
    // best-effort — the live map degrades to its polling fallback.
  }
}
