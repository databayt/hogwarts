"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

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

  useEffect(() => {
    // Auto-refresh signed URL every 4 minutes (TTL is 5 min).
    if (!url) return
    const t = setTimeout(load, 4 * 60 * 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

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
      className="aspect-video w-full rounded-md bg-black"
    />
  )
}
