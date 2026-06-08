"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { useRemoteParticipants } from "@livekit/components-react"

import { Button } from "@/components/ui/button"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { kickParticipant } from "@/components/school-dashboard/conference/actions/moderation"

export interface ParticipantsPanelLabels {
  title: string
  remove: string
  removing: string
  removed: string
  failed: string
  empty: string
}

/**
 * HOST-only moderation overlay rendered alongside the prebuilt
 * `<VideoConference/>`. Lists the remote participants (the hook already
 * excludes the local host) and lets a HOST/CO_HOST evict one via the existing
 * `kickParticipant` server action — LiveKit's `removeParticipant` expects the
 * participant `identity`, which equals the userId the token was minted with.
 * Non-moderators render nothing.
 */
export function ParticipantsPanel({
  sessionId,
  canModerate,
  labels,
}: {
  sessionId: string
  canModerate: boolean
  labels: ParticipantsPanelLabels
}) {
  const participants = useRemoteParticipants()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<Set<string>>(() => new Set())
  const [removed, setRemoved] = useState<Set<string>>(() => new Set())
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Move focus into the panel when it opens so keyboard users land on it.
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!canModerate) return null

  function closePanel() {
    setOpen(false)
    toggleRef.current?.focus()
  }

  async function onRemove(identity: string) {
    setPending((prev) => new Set(prev).add(identity))
    try {
      const res = await kickParticipant(sessionId, identity)
      if ("success" in res && res.success) {
        // Optimistically hide; the SFU eviction + webhook participant_left
        // reconcile the grid and DB row shortly after.
        setRemoved((prev) => new Set(prev).add(identity))
        SuccessToast(labels.removed)
      } else {
        ErrorToast(labels.failed)
      }
    } catch {
      ErrorToast(labels.failed)
    } finally {
      setPending((prev) => {
        const next = new Set(prev)
        next.delete(identity)
        return next
      })
    }
  }

  const visible = participants.filter((p) => !removed.has(p.identity))

  return (
    <div className="absolute end-4 top-4 z-10 w-64">
      <Button
        ref={toggleRef}
        type="button"
        size="sm"
        variant="secondary"
        aria-expanded={open}
        aria-controls="conference-participants-panel"
        onClick={() => setOpen((o) => !o)}
      >
        {labels.title} ({visible.length})
      </Button>
      {open && (
        <div
          ref={panelRef}
          id="conference-participants-panel"
          role="region"
          aria-label={labels.title}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") closePanel()
          }}
          className="bg-background/95 mt-2 rounded-lg border p-3 shadow-lg backdrop-blur outline-none"
        >
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">{labels.empty}</p>
          ) : (
            <ul className="space-y-1">
              {visible.map((p) => (
                <li
                  key={p.identity}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate text-sm">
                    {p.name || p.identity}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive h-7 px-2"
                    aria-label={`${labels.remove}: ${p.name || p.identity}`}
                    disabled={pending.has(p.identity)}
                    onClick={() => onRemove(p.identity)}
                  >
                    {pending.has(p.identity) ? labels.removing : labels.remove}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
