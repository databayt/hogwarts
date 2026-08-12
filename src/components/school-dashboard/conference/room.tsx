"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react"

import "@livekit/components-styles"

import {
  ParticipantsPanel,
  type ParticipantsPanelLabels,
} from "@/components/school-dashboard/conference/participants-panel"
import type { RoomJoinTicket } from "@/components/school-dashboard/conference/types"

interface Props {
  initialTicket: RoomJoinTicket
  sessionId: string
  locale: string
  labels: {
    leaving: string
    reconnecting: string
    error: string
    participants: ParticipantsPanelLabels
  }
}

// Eligibility verdicts — the server said no. Eject immediately; retrying
// would only stretch the ≤5-min revocation window. Anything else (network
// blip, 5xx, SFU hiccup) is transient: the established WebRTC session keeps
// running past token expiry, the fresh token only matters for RECONNECTS —
// so retry quietly instead of tearing down a working call.
// Literals mirror ACTION_ERRORS values (not imported — keep server-only
// modules out of this client bundle).
const DENY_CODES = new Set([
  "NOT_AUTHENTICATED",
  "MISSING_SCHOOL",
  "UNAUTHORIZED",
  "LIVE_CLASS_NOT_FOUND",
  "LIVE_CLASS_PARTICIPANT_DENIED",
  "LIVE_CLASS_INVALID_STATE",
])
const MAX_TRANSIENT_RETRIES = 3
const RETRY_DELAY_MS = 20_000

/**
 * Full-screen LiveKit conferencing UI. Uses the official prebuilt
 * `VideoConference` component for the room (controls, grid, chat) and
 * refreshes the JWT before it expires.
 *
 * The refresh polls GET /api/conference/token — deliberately NOT a server
 * action: auth() rotates the session cookie in action requests, so every
 * action-based poll ships a full RSC page re-render (~1MB) per participant
 * per refresh (the notifications-bell lesson).
 */
export function RoomClient({
  initialTicket,
  sessionId,
  locale,
  labels,
}: Props) {
  const router = useRouter()
  const [ticket, setTicket] = useState(initialTicket)
  const [error, setError] = useState<string | null>(null)

  // Refresh the token ~60s before expiry; retry transient failures in place.
  useEffect(() => {
    if (error) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let retries = 0

    const refresh = async () => {
      try {
        const res = await fetch(
          `/api/conference/token?sessionId=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        )
        const result = (await res.json()) as
          | { success: true; data: RoomJoinTicket }
          | { success: false; error?: string }
        if (cancelled) return
        if (result.success) {
          setTicket(result.data) // re-arms the effect for the next window
          return
        }
        if (result.error && DENY_CODES.has(result.error)) {
          setError(labels.error)
          return
        }
      } catch {
        // fall through to the transient-retry path
      }
      if (cancelled) return
      if (retries < MAX_TRANSIENT_RETRIES) {
        retries++
        timer = setTimeout(refresh, RETRY_DELAY_MS)
      } else {
        setError(labels.error)
      }
    }

    const expiresAtMs = new Date(ticket.expiresAt).getTime()
    const refreshAt = Math.max(0, expiresAtMs - Date.now() - 60_000)
    timer = setTimeout(refresh, refreshAt)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [ticket.expiresAt, sessionId, labels.error, error])

  if (error) {
    return (
      <div className="bg-background flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-destructive text-base font-medium">{error}</p>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => router.push(`/${locale}/conference/${sessionId}`)}
        >
          {labels.leaving}
        </button>
      </div>
    )
  }

  return (
    <div data-lk-theme="default" className="bg-background h-screen w-screen">
      <LiveKitRoom
        token={ticket.token}
        serverUrl={ticket.wsUrl}
        connect
        audio={ticket.role !== "OBSERVER"}
        video={ticket.role !== "OBSERVER"}
        onDisconnected={() => {
          router.push(`/${locale}/conference/${sessionId}`)
        }}
        className="h-full w-full"
      >
        <VideoConference />
        <ParticipantsPanel
          sessionId={sessionId}
          canModerate={ticket.role === "HOST" || ticket.role === "CO_HOST"}
          labels={labels.participants}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}
