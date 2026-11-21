"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Everything in the room that needs the LiveKit SDK: the <LiveKitRoom> tree,
// the room options per role, RoomShell and the SDK's stylesheet. `room.tsx`
// loads this with `next/dynamic` (ssr: false) so the pre-join card — the first
// thing anyone sees — ships none of it. The ticket lifecycle and how the room
// ENDS stay in `room.tsx`; this file reports an end through `onEnd`.
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutContextProvider, LiveKitRoom } from "@livekit/components-react"
import {
  AudioPresets,
  ConnectionError,
  ConnectionErrorReason,
  DisconnectReason,
  MediaDeviceFailure,
  ScreenSharePresets,
  VideoPresets,
  type RoomOptions,
} from "livekit-client"

import "@livekit/components-styles"

import type { ParticipantsPanelLabels } from "@/components/school-dashboard/live/participants-panel"
import type {
  ConferenceParticipantRole,
  RoomJoinTicket,
} from "@/components/school-dashboard/live/types"

import type { RoomLabels } from "./labels"
import { RoomShell } from "./room-shell"
import { SilentHostBanner } from "./silent-host-banner"
import type { SlideOption } from "./slide-options"
import type { RoomTitleCardData } from "./title-card"

/** How a call ended, reported up to `room.tsx` which draws the end screen. */
export type InCallEnd = "removed" | "ended" | "elsewhere" | "lost"

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
      // A class is speech. The SDK's default is its music preset (48 kbps);
      // speech is 24 — half the audio every phone in the room has to pull
      // down, on the links that can least afford it, for a voice that sounds
      // the same.
      audioPreset: AudioPresets.speech,
      simulcast: true,
      videoSimulcastLayers: isHost
        ? [VideoPresets.h180, VideoPresets.h360]
        : [VideoPresets.h180],
      screenShareEncoding: ScreenSharePresets.h720fps15.encoding,
    },
    stopLocalTrackOnUnpublish: true,
  }
}

interface Props {
  ticket: RoomJoinTicket
  sessionId: string
  title: string
  locale: string
  card: RoomTitleCardData
  labels: { room: RoomLabels; participants: ParticipantsPanelLabels }
  slides: SlideOption[]
  viewerEmail?: string | null
  /** The class clock's bell has rung — owned by `room.tsx`'s timers. */
  closing: boolean
  /** Where a leave (CLIENT_INITIATED disconnect) goes. */
  detailHref: string
  onEnd: (kind: InCallEnd) => void
}

export function InCall({
  ticket,
  sessionId,
  title,
  locale,
  card,
  labels,
  slides,
  viewerEmail,
  closing,
  detailHref,
  onEnd,
}: Props) {
  const router = useRouter()
  // A camera/mic the browser refused or could not find. The call carries on —
  // a student who denied the camera can still listen — so this is a notice
  // over the room, not an error that replaces it.
  const [deviceNotice, setDeviceNotice] = useState<string | null>(null)
  const [micFailed, setMicFailed] = useState(false)
  const options = useMemo(() => roomOptionsFor(ticket.role), [ticket.role])
  const isHost = ticket.role === "HOST" || ticket.role === "CO_HOST"

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
        onMediaDeviceFailure={(failure, kind) => {
          if (kind === "audioinput") setMicFailed(true)
          const device =
            kind === "audioinput"
              ? labels.room.deviceMic
              : labels.room.deviceCamera
          const text =
            failure === MediaDeviceFailure.PermissionDenied
              ? labels.room.deviceDenied
              : failure === MediaDeviceFailure.NotFound
                ? labels.room.deviceMissing
                : failure === MediaDeviceFailure.DeviceInUse
                  ? labels.room.deviceInUse
                  : labels.room.deviceFailed
          setDeviceNotice(text.replace("{device}", device))
        }}
        // A connection that never came up. Without this the only trace was a
        // console warning and the reader sat on an empty stage. The same
        // callback also fires for a camera or microphone that would not start
        // — the device notice above covers that and the call carries on — so
        // only a CONNECTION error ends the room, and never the cancel that a
        // leave (or a remount) produces.
        onError={(err) => {
          if (
            err instanceof ConnectionError &&
            err.reason !== ConnectionErrorReason.Cancelled
          ) {
            onEnd("lost")
          }
        }}
        onDisconnected={(reason) => {
          switch (reason) {
            case DisconnectReason.CLIENT_INITIATED:
              router.push(detailHref)
              return
            case DisconnectReason.PARTICIPANT_REMOVED:
              onEnd("removed")
              return
            case DisconnectReason.ROOM_DELETED:
            case DisconnectReason.ROOM_CLOSED:
              onEnd("ended")
              return
            case DisconnectReason.DUPLICATE_IDENTITY:
              onEnd("elsewhere")
              return
            default:
              // The SDK already retried (Reconnecting → this). Offer a rejoin
              // instead of bouncing the student to the detail page mid-class.
              onEnd("lost")
          }
        }}
        className="h-full w-full"
      >
        {deviceNotice && (
          <div
            role="alert"
            className="bg-background/95 fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border p-3 text-sm shadow-lg"
          >
            <p className="flex-1">{deviceNotice}</p>
            <button
              type="button"
              className="text-muted-foreground shrink-0 underline"
              onClick={() => setDeviceNotice(null)}
            >
              {labels.room.dismiss}
            </button>
          </div>
        )}
        {isHost && (
          <SilentHostBanner micFailed={micFailed} labels={labels.room} />
        )}
        <LayoutContextProvider>
          <RoomShell
            sessionId={sessionId}
            title={title}
            // The player's small line: where the class is, then which lesson.
            subtitle={
              [card.grade ?? card.section, card.lesson]
                .filter(Boolean)
                .join(" · ") || null
            }
            role={ticket.role}
            hostIdentity={ticket.hostIdentity}
            labels={labels.room}
            participantsLabels={labels.participants}
            slides={slides}
            config={ticket.roomConfig}
            clock={{ startsAtMs: card.startsAtMs, endsAtMs: card.endsAtMs }}
            closing={closing}
            viewerEmail={viewerEmail}
            locale={locale}
          />
        </LayoutContextProvider>
      </LiveKitRoom>
    </div>
  )
}
