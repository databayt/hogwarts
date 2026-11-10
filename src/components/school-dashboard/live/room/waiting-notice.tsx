"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRemoteParticipants } from "@livekit/components-react"
import { RoomEvent } from "livekit-client"

import { cn } from "@/lib/utils"
import {
  glassPill,
  glassSurface,
} from "@/components/lumos/shared/video-player/glass"
import type { ConferenceParticipantRole } from "@/components/school-dashboard/live/types"

import type { RoomLabels } from "./labels"
import { waitingFor, waitingText } from "./waiting"

/** Only what changes who is in the room — not every track and speaker event. */
const UPDATE_ON = [
  RoomEvent.ParticipantConnected,
  RoomEvent.ParticipantDisconnected,
  RoomEvent.ParticipantAttributesChanged,
  RoomEvent.ConnectionStateChanged,
]

/** The sentence for whoever the reader is waiting for, or null. */
export function useWaitingText(
  role: ConferenceParticipantRole,
  labels: RoomLabels
): string | null {
  const others = useRemoteParticipants({ updateOnlyOn: UPDATE_ON })
  return waitingText(
    labels,
    role,
    waitingFor(
      role,
      others.map((p) => p.attributes?.role)
    )
  )
}

/**
 * The waiting sentence as a notice under the top pills, for the layouts where
 * the stage is busy with something else — the reader's own camera, the board,
 * classmates. When the stage is empty it prints the sentence itself (it marks
 * itself `data-stage-alone`) and this one steps aside.
 *
 * It fades in after three seconds: a teacher whose connection blips must not
 * flash "the teacher isn't here" at a whole class.
 */
export function WaitingNotice({
  role,
  labels,
}: {
  role: ConferenceParticipantRole
  labels: RoomLabels
}) {
  const text = useWaitingText(role, labels)
  if (!text) return null
  return (
    <p
      role="status"
      data-waiting-notice=""
      className={cn(
        glassPill,
        "max-w-md px-4 py-2 text-center text-sm text-balance text-white",
        "animate-in fade-in fill-mode-both delay-[3000ms] duration-300 motion-reduce:animate-none",
        "group-has-[[data-stage-alone]]/stage:hidden"
      )}
      style={glassSurface}
    >
      {text}
    </p>
  )
}
