"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { VideoWatermark } from "@/components/lumos/shared/video-player/video-watermark"
import { getRecordingUrl } from "@/components/school-dashboard/live/actions/recordings"

interface Props {
  recordingId: string
  /** Who is watching — stamped into the watermark. */
  viewer?: { id?: string; email?: string | null }
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
export function RecordingPlayer({ recordingId, labels, viewer }: Props) {
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
    // Watched in the app, never saved: no download control, no
    // picture-in-picture or casting (both leave the watermark behind), no
    // context menu, and a forensic watermark with the viewer's identity.
    <div
      data-video-protected
      className="relative aspect-video w-full overflow-hidden rounded-md bg-black select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <video
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        src={url}
        onError={() => {
          setUrl(null)
          setError(labels.error)
        }}
        className="h-full w-full"
      />
      <VideoWatermark
        userId={viewer?.id}
        userEmail={viewer?.email ?? undefined}
      />
    </div>
  )
}
