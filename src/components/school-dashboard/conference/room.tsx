"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutContextProvider,
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react"
import {
  DisconnectReason,
  ScreenSharePresets,
  VideoPresets,
  type RoomOptions,
} from "livekit-client"

import "@livekit/components-styles"

import type { ParticipantsPanelLabels } from "@/components/school-dashboard/conference/participants-panel"
import type {
  ConferenceParticipantRole,
  RoomJoinTicket,
} from "@/components/school-dashboard/conference/types"

import type { RoomLabels } from "./room/labels"
import { RoomShell } from "./room/room-shell"
import type { SlideOption } from "./room/slide-options"

interface Props {
  initialTicket: RoomJoinTicket
  sessionId: string
  title: string
  locale: string
  labels: {
    error: string
    room: RoomLabels
    participants: ParticipantsPanelLabels
  }
  slides: SlideOption[]
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
 * Room options per role.
 *
 * `adaptiveStream` is OFF on purpose: with it on, the SDK owns every remote
 * video subscription and ignores `setVideoQuality`/`setEnabled`, which
 * would turn the delivery ladder (room/use-adaptive-delivery.ts) into a
 * no-op. `dynacast` stays on so the teacher's unused simulcast layers are
 * paused at the source. The teacher publishes 720p with 360/180 simulcast
 * layers — the three rungs the ladder steps through before audio-only.
 */
function roomOptionsFor(role: ConferenceParticipantRole): RoomOptions {
  const isHost = role === "HOST" || role === "CO_HOST"
  return {
    adaptiveStream: false,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: isHost
        ? VideoPresets.h720.resolution
        : VideoPresets.h360.resolution,
    },
    publishDefaults: {
      simulcast: true,
      videoSimulcastLayers: isHost
        ? [VideoPresets.h180, VideoPresets.h360]
        : [VideoPresets.h180],
      screenShareEncoding: ScreenSharePresets.h720fps15.encoding,
    },
    stopLocalTrackOnUnpublish: true,
  }
}

type Ended =
  | { kind: "removed" }
  | { kind: "ended" }
  | { kind: "elsewhere" }
  | { kind: "lost" }

/**
 * Full-screen live-class room. Owns the join ticket's lifecycle (refresh
 * before expiry, eject on a server "no") and how the room ends; everything
 * inside the call lives in `room/room-shell.tsx`.
 */
export function RoomClient({
  initialTicket,
  sessionId,
  title,
  locale,
  labels,
  slides,
}: Props) {
  const router = useRouter()
  const [ticket, setTicket] = useState(initialTicket)
  const [error, setError] = useState<string | null>(null)
  const [ended, setEnded] = useState<Ended | null>(null)
  const options = useMemo(() => roomOptionsFor(ticket.role), [ticket.role])
  const isHost = ticket.role === "HOST" || ticket.role === "CO_HOST"

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

  const detailHref = `/${locale}/conference/${sessionId}`

  if (error || ended) {
    const message = error
      ? error
      : ended?.kind === "removed"
        ? labels.room.removedByHost
        : ended?.kind === "ended"
          ? labels.room.classEnded
          : ended?.kind === "elsewhere"
            ? labels.room.openedElsewhere
            : labels.room.connectionLost
    return (
      <div className="bg-background flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p
          className={
            "text-base font-medium " +
            (error || ended?.kind === "lost" ? "text-destructive" : "")
          }
        >
          {message}
        </p>
        <div className="flex gap-3">
          {ended?.kind === "lost" && (
            // A full reload re-runs the server join: fresh eligibility check,
            // fresh token, clean SDK state.
            <button
              type="button"
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
              onClick={() => window.location.reload()}
            >
              {labels.room.rejoin}
            </button>
          )}
          <button
            type="button"
            className="text-sm underline"
            onClick={() => router.push(detailHref)}
          >
            {labels.room.backToClass}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div data-lk-theme="default" className="bg-background h-dvh w-full">
      <LiveKitRoom
        token={ticket.token}
        serverUrl={ticket.wsUrl}
        connect
        options={options}
        // Teachers come in live. Students follow the school setting (with a
        // per-session override): muted and camera off by default, because a
        // class of thirty phones should not open on thirty cameras.
        audio={
          isHost || (ticket.role !== "OBSERVER" && !ticket.roomConfig.joinMuted)
        }
        video={
          isHost || (ticket.role !== "OBSERVER" && !ticket.roomConfig.joinMuted)
        }
        onDisconnected={(reason) => {
          switch (reason) {
            case DisconnectReason.CLIENT_INITIATED:
              router.push(detailHref)
              return
            case DisconnectReason.PARTICIPANT_REMOVED:
              setEnded({ kind: "removed" })
              return
            case DisconnectReason.ROOM_DELETED:
            case DisconnectReason.ROOM_CLOSED:
              setEnded({ kind: "ended" })
              return
            case DisconnectReason.DUPLICATE_IDENTITY:
              setEnded({ kind: "elsewhere" })
              return
            default:
              // The SDK already retried (Reconnecting → this). Offer a rejoin
              // instead of bouncing the student to the detail page mid-class.
              setEnded({ kind: "lost" })
          }
        }}
        className="h-full w-full"
      >
        <LayoutContextProvider>
          <RoomShell
            sessionId={sessionId}
            title={title}
            role={ticket.role}
            hostIdentity={ticket.hostIdentity}
            labels={labels.room}
            participantsLabels={labels.participants}
            slides={slides}
            config={ticket.roomConfig}
          />
        </LayoutContextProvider>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}
