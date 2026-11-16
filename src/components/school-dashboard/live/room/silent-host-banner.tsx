"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { useConnectionState, useLocalParticipant } from "@livekit/components-react"
import { ConnectionState } from "livekit-client"

import type { RoomLabels } from "./labels"

/** How long a host may sit connected without sound before we shout. */
export const SILENT_HOST_MS = 5000

/**
 * A teacher with no live microphone teaches an empty room. Persistent red
 * banner for HOST / CO_HOST when, 5 s after connecting, no published unmuted
 * mic track exists — or the mic device failed outright.
 */
export function SilentHostBanner({
  micFailed,
  labels,
}: {
  micFailed: boolean
  labels: RoomLabels
}) {
  const state = useConnectionState()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const [waited, setWaited] = useState(false)
  const connected = state === ConnectionState.Connected

  useEffect(() => {
    if (!connected) return
    const t = setTimeout(() => setWaited(true), SILENT_HOST_MS)
    return () => clearTimeout(t)
  }, [connected])

  if (!connected || isMicrophoneEnabled) return null
  if (!waited && !micFailed) return null
  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[60] flex flex-wrap items-center justify-center gap-3 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
    >
      <span>{labels.micOffBanner}</span>
      <button
        type="button"
        className="rounded-md bg-white px-3 py-1 text-red-700"
        onClick={() => void localParticipant.setMicrophoneEnabled(true)}
      >
        {labels.micOffAction}
      </button>
    </div>
  )
}
