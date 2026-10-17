"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef } from "react"
import { useConnectionState } from "@livekit/components-react"
import { ConnectionState } from "livekit-client"

import { getBoard, saveBoard } from "../../actions/board"
import type { ClassChannel } from "../use-class-channel"
import { MAX_STROKES } from "./board-canvas"

const SAVE_AFTER_MS = 4000

/**
 * The host keeps the board across a reload: on entering, put back what was
 * saved (when this room's board is still empty); afterwards, save the page a
 * few seconds after it stops changing. Best-effort both ways — a failed
 * save never interrupts the class.
 */
export function useBoardMemory(opts: {
  sessionId: string
  channel: ClassChannel
  enabled: boolean
}) {
  const { sessionId, channel } = opts
  // Restoring broadcasts the strokes, so wait for the room to be up.
  const connected = useConnectionState() === ConnectionState.Connected
  const enabled = opts.enabled && connected
  const strokes = channel.state.strokes
  const loadedRef = useRef(false)
  const lastSavedRef = useRef<string | null>(null)
  const sendRef = useRef(channel.send)
  const strokesRef = useRef(strokes)
  useEffect(() => {
    sendRef.current = channel.send
    strokesRef.current = strokes
  }, [channel.send, strokes])

  useEffect(() => {
    if (!enabled || loadedRef.current) return
    let cancelled = false
    void getBoard({ sessionId })
      .then((res) => {
        if (cancelled || !res.success) return
        loadedRef.current = true
        const saved = res.data.strokes
        lastSavedRef.current = saved.map((s) => s.id).join(",")
        if (saved.length === 0 || strokesRef.current.length > 0) return
        for (const stroke of saved)
          void sendRef.current({ t: "wb.stroke", stroke }).catch(() => {})
      })
      .catch(() => {
        loadedRef.current = true
      })
    return () => {
      cancelled = true
    }
  }, [enabled, sessionId])

  useEffect(() => {
    if (!enabled || !loadedRef.current) return
    const key = strokes.map((s) => s.id).join(",")
    if (key === lastSavedRef.current) return
    const t = window.setTimeout(() => {
      lastSavedRef.current = key
      void saveBoard({
        sessionId,
        strokes: strokes.slice(-MAX_STROKES),
      }).catch(() => {})
    }, SAVE_AFTER_MS)
    return () => window.clearTimeout(t)
  }, [enabled, sessionId, strokes])
}
