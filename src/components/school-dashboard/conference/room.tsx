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
// would only stretch the ≤5-min revocation window.
//
// Everything else (network blip, 5xx, SFU hiccup) is transient and must NEVER
// tear down the call. Verified against the SDK: `Room.connect` returns early
// when the room is already connected, so the token this poll fetches never
// reaches the live room at all, and the SFU refreshes tokens for reconnects
// itself over the signal channel (`SignalClient.onTokenRefresh`). This poll is
// therefore an ELIGIBILITY HEARTBEAT, not a token pump — a class in progress
// is completely unaffected by it failing, so ejecting a working call because a
// heartbeat endpoint had a bad minute is pure self-harm.
//
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
const RETRY_DELAY_MS = 20_000
/** Back off on repeated failure instead of hammering a struggling endpoint. */
const MAX_RETRY_DELAY_MS = 5 * 60_000

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
      // Keep trying, with backoff, for as long as the user is in the room.
      // There is no failure count at which giving up helps: the call is fine,
      // and the only thing lost is the revocation check.
      retries++
      timer = setTimeout(
        refresh,
        Math.min(RETRY_DELAY_MS * retries, MAX_RETRY_DELAY_MS)
      )
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
    // `dir="ltr"` is deliberate. LiveKit's prebuilt UI has no i18n hook — its
    // control-bar and chat strings are hardcoded English inside the package —
    // so letting it inherit the page's RTL direction mirrors the LAYOUT of an
    // interface whose text is still left-to-right, which is worse than either
    // language on its own. Pin it until the control bar is composed from our
    // own primitives (tracked in ISSUE.md); everything we DO render around it
    // stays translated.
    <div
      data-lk-theme="default"
      dir="ltr"
      className="bg-background h-screen w-screen"
    >
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
