"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { getRecordingUrl } from "@/components/school-dashboard/conference/actions/recordings"

interface Props {
  recordingId: string
  labels: {
    play: string
    loading: string
    error: string
  }
}

/**
 * Signed-URL playback. The URL is signed for a full viewing session (4h) —
 * deliberately NO refresh timer: swapping `src` mid-playback reloads the
 * element and resets it to 0:00. If the signature does expire (tab left open
 * for hours), the video element fires `onError` and we drop back to the Play
 * button, which mints a fresh URL on click.
 */
export function RecordingPlayer({ recordingId, labels }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const result = await getRecordingUrl(recordingId)
    setLoading(false)
    if ("success" in result && result.success) {
      setUrl(result.data.url)
    } else {
      setError(labels.error)
    }
  }

  if (!url) {
    return (
      <Button size="sm" onClick={load} disabled={loading}>
        {loading ? labels.loading : labels.play}
        {error ? ` · ${error}` : null}
      </Button>
    )
  }

  return (
    <video
      controls
      src={url}
      onError={() => {
        setUrl(null)
        setError(labels.error)
      }}
      className="aspect-video w-full rounded-md bg-black"
    />
  )
}
