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

import { refreshLiveClassToken } from "@/components/school-dashboard/conference/actions/tokens"
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

/**
 * Full-screen LiveKit conferencing UI. Uses the official prebuilt
 * `VideoConference` component for the room (controls, grid, chat) and
 * refreshes the JWT before it expires.
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

  // Refresh the token ~60s before expiry.
  useEffect(() => {
    const expiresAtMs = new Date(ticket.expiresAt).getTime()
    const refreshAt = Math.max(0, expiresAtMs - Date.now() - 60_000)
    const timeout = setTimeout(async () => {
      const result = await refreshLiveClassToken(sessionId)
      if ("success" in result && result.success) {
        setTicket(result.data)
      } else {
        setError(labels.error)
      }
    }, refreshAt)
    return () => clearTimeout(timeout)
  }, [ticket.expiresAt, sessionId, labels.error])

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
          canModerate={
            ticket.role === "HOST" || ticket.role === "CO_HOST"
          }
          labels={labels.participants}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}
