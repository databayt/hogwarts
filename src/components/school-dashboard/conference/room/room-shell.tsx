"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocalParticipant } from "@livekit/components-react"
import { Hand } from "lucide-react"

import { VideoWatermark } from "@/components/lumos/shared/video-player/video-watermark"
import { recordClassEvent } from "@/components/school-dashboard/conference/actions/room-events"
import {
  ParticipantsPanel,
  type ParticipantsPanelLabels,
} from "@/components/school-dashboard/conference/participants-panel"
import type { ConferenceParticipantRole } from "@/components/school-dashboard/conference/types"

import type { Poll } from "./class-channel"
import { ControlBar } from "./control-bar"
import type { RoomLabels } from "./labels"
import { AudioOnlyBanner, QualityDot, ReconnectingOverlay } from "./overlays"
import { SidePanel, type PanelTab } from "./side-panel"
import type { SlideOption } from "./slide-options"
import { Stage } from "./stage"
import { useAdaptiveDelivery } from "./use-adaptive-delivery"
import { useClassChannel } from "./use-class-channel"

interface RoomShellProps {
  sessionId: string
  title: string
  role: ConferenceParticipantRole
  hostIdentity: string | null
  labels: RoomLabels
  participantsLabels: ParticipantsPanelLabels
  slides: SlideOption[]
}

/** Everything inside the connected room: stage, side panel, bar, overlays. */
export function RoomShell({
  sessionId,
  title,
  role,
  hostIdentity,
  labels,
  participantsLabels,
  slides,
}: RoomShellProps) {
  const isHost = role === "HOST" || role === "CO_HOST"
  const channel = useClassChannel({ hostIdentity, isHost })
  const adaptive = useAdaptiveDelivery()
  const { localParticipant } = useLocalParticipant()
  const [panel, setPanel] = useState<PanelTab | null>(null)

  // The host's client is the room's memory: closed polls and questions
  // become ConferenceEvent rows. Best-effort — a failed write never
  // interrupts the class.
  const onPollClosed = useCallback(
    (poll: Poll) => {
      void recordClassEvent({
        sessionId,
        kind: "poll_closed",
        key: poll.id,
        payload: {
          question: poll.question,
          options: poll.options,
          counts: poll.counts,
          total: poll.total,
        },
      }).catch(() => {})
    },
    [sessionId]
  )
  const onQuestion = useCallback(
    (id: string, text: string, from: string) => {
      void recordClassEvent({
        sessionId,
        kind: "question",
        key: id,
        payload: { text, from },
      }).catch(() => {})
    },
    [sessionId]
  )

  // Persist each question once as it arrives — here, not in the questions
  // tab, so a host who never opens the tab still leaves a record.
  const seen = useRef(new Set<string>())
  useEffect(() => {
    if (!isHost) return
    for (const q of channel.state.questions) {
      if (seen.current.has(q.id)) continue
      seen.current.add(q.id)
      onQuestion(q.id, q.text, q.name)
    }
  }, [channel.state.questions, isHost, onQuestion])

  return (
    <div className="relative flex h-full w-full flex-col bg-black text-white">
      <ReconnectingOverlay labels={labels} />

      <header className="flex items-center gap-3 px-3 py-1.5 text-sm">
        <QualityDot quality={adaptive.quality} labels={labels} />
        <span className="truncate font-medium">{title}</span>
        {channel.hands.length > 0 && (
          <span
            className="flex items-center gap-1 text-xs text-amber-300"
            title={labels.handsRaised}
          >
            <Hand className="h-3.5 w-3.5" aria-hidden />
            {channel.hands.length}
          </span>
        )}
        <span className="ms-auto text-xs text-white/50">
          {labels.attendanceAuto}
        </span>
      </header>

      <AudioOnlyBanner on={adaptive.tier === "audio"} labels={labels} />

      <div className="relative flex min-h-0 flex-1">
        <main
          className="relative min-w-0 flex-1 select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          <Stage channel={channel} labels={labels} />
          {/* Forensic mark over the whole stage: a recording or screenshot
              of the class carries who was watching. */}
          <VideoWatermark
            userId={localParticipant.identity}
            userEmail={localParticipant.name ?? undefined}
            rotationInterval={20000}
          />
        </main>
        {panel && (
          <div className="absolute inset-y-0 end-0 z-10 sm:static sm:z-auto">
            <SidePanel
              tab={panel}
              onTab={setPanel}
              onClose={() => setPanel(null)}
              channel={channel}
              canAsk={role !== "OBSERVER"}
              isHost={isHost}
              localIdentity={localParticipant.identity}
              labels={labels}
              onPollClosed={isHost ? onPollClosed : undefined}
              onQuestion={isHost ? onQuestion : undefined}
            />
          </div>
        )}
        <ParticipantsPanel
          sessionId={sessionId}
          canModerate={isHost}
          labels={participantsLabels}
        />
      </div>

      <ControlBar
        role={role}
        labels={labels}
        channel={channel}
        adaptive={adaptive}
        panel={panel}
        onPanel={setPanel}
        slides={slides}
      />
    </div>
  )
}
