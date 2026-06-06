// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { typography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { listRecordings } from "@/components/school-dashboard/conference/actions/recordings"

import { RecordingPlayer } from "./recording-player"

interface Props {
  sessionId: string
  locale: string
  dictionary: Dictionary
}

function formatBytes(b: number | bigint | null): string {
  if (!b) return "—"
  const n = typeof b === "bigint" ? Number(b) : b
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDuration(s: number | null): string {
  if (!s) return "—"
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${ss.toString().padStart(2, "0")}`
}

export async function RecordingsContent({
  sessionId,
  locale,
  dictionary,
}: Props) {
  const result = await listRecordings(sessionId)
  const recordings = "success" in result && result.success ? result.data : []

  const t = dictionary?.liveClasses

  const playerLabels = {
    play: t?.actions?.play ?? "Play",
    loading: t?.actions?.loading ?? "Loading…",
    error: t?.errors?.recordingFailed ?? "Could not load the recording.",
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className={typography.h2}>{t?.labels?.recordings ?? "Recordings"}</h1>
      {recordings.length === 0 ? (
        <p className={typography.muted}>
          {t?.recording?.empty ?? "No recordings yet for this class."}
        </p>
      ) : (
        <ul className="space-y-4">
          {recordings.map((r) => (
            <li key={r.id} className="rounded-md border p-4 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span>
                  {new Date(r.createdAt).toLocaleString(
                    locale === "ar" ? "ar-AE" : "en-AE"
                  )}
                </span>
                <Badge variant={r.status === "ready" ? "default" : "secondary"}>
                  {t?.recording?.[r.status] ?? r.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {formatDuration(r.durationSeconds)} ·{" "}
                {formatBytes(r.fileSizeBytes)}
              </p>
              {r.status === "ready" && (
                <div className="mt-3">
                  <RecordingPlayer recordingId={r.id} labels={playerLabels} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
