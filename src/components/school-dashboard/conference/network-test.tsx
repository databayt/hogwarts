"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { ConnectionQuality, ConnectionState, Room } from "livekit-client"

import { typography } from "@/lib/typography"
import { Button } from "@/components/ui/button"

interface Props {
  wsUrl: string
  /** Server-issued short-lived diagnostic token (HOST grants on a calibration room). */
  token: string
  /** Pre-localized labels — passed from the server page. */
  labels: {
    heading: string
    description: string
    run: string
    running: string
    connected: string
    setupTime: string
    quality: string
    path: string
    error: string
    yes: string
    no: string
  }
}

type TestResult = {
  connected: boolean
  durationMs: number
  quality: string
  protocol: string
  error?: string
}

/**
 * Aldar Meeting-3 gate: validate that LiveKit reaches our SFU from inside
 * an Aldar school WiFi, including TURN-over-443-TCP fallback under UAE
 * VoIP throttling.
 */
export function NetworkTestClient({ wsUrl, token, labels }: Props) {
  const [result, setResult] = useState<TestResult | null>(null)
  const [running, setRunning] = useState(false)

  async function runTest() {
    setRunning(true)
    setResult(null)
    const room = new Room()
    const t0 = Date.now()
    try {
      await room.connect(wsUrl, token, { autoSubscribe: false })
      const quality = qualityName(room.localParticipant.connectionQuality)
      const protocol = inferProtocol(room)
      setResult({
        connected: true,
        durationMs: Date.now() - t0,
        quality,
        protocol,
      })
    } catch (err) {
      setResult({
        connected: false,
        durationMs: Date.now() - t0,
        quality: "unknown",
        protocol: "unknown",
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      try {
        await room.disconnect()
      } catch {
        /* no-op */
      }
      setRunning(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className={typography.h2}>{labels.heading}</h1>
      <p className={typography.muted}>{labels.description}</p>
      <Button onClick={runTest} disabled={running}>
        {running ? labels.running : labels.run}
      </Button>
      {result && (
        <dl className="space-y-2 rounded-md border p-4 text-sm">
          <Row
            label={labels.connected}
            value={result.connected ? labels.yes : labels.no}
          />
          <Row label={labels.setupTime} value={`${result.durationMs} ms`} />
          <Row label={labels.quality} value={result.quality} />
          <Row label={labels.path} value={result.protocol} />
          {result.error && (
            <Row
              label={labels.error}
              value={result.error}
              className="text-destructive"
            />
          )}
        </dl>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={className}>{value}</dd>
    </div>
  )
}

function qualityName(q: ConnectionQuality): string {
  switch (q) {
    case ConnectionQuality.Excellent:
      return "excellent"
    case ConnectionQuality.Good:
      return "good"
    case ConnectionQuality.Poor:
      return "poor"
    case ConnectionQuality.Lost:
      return "lost"
    default:
      return "unknown"
  }
}

function inferProtocol(room: Room): string {
  if (room.state !== ConnectionState.Connected) return "—"
  return "direct/turn"
}
