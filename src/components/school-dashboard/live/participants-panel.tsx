"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { useRemoteParticipants } from "@livekit/components-react"
import { Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import {
  glassMenu,
  glassPill,
  glassSurface,
} from "@/components/lumos/shared/video-player/glass"
import { kickParticipant } from "@/components/school-dashboard/live/actions/moderation"

import { glyph } from "./room/glyph"

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
 *
 * Two faces. `pill` is its own glass pill with the word and the count, for a
 * chrome row that has room for words. `glyph` is a bare people glyph with the
 * count beside it, for a slot INSIDE a pill the room's top chrome already owns
 * — the list then floats under the pill rather than pushing it open.
 */
export function ParticipantsPanel({
  sessionId,
  canModerate,
  labels,
  variant = "pill",
  onOpenChange,
}: {
  sessionId: string
  canModerate: boolean
  labels: ParticipantsPanelLabels
  variant?: "pill" | "glyph"
  /** The list is open — the chrome it sits in must not auto-hide under it. */
  onOpenChange?: (open: boolean) => void
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
  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

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
  const asGlyph = variant === "glyph"

  return (
    // Positioned by the room's top chrome row, not by itself — it is one
    // pill among the others up there, or one glyph inside one.
    <div
      className={cn(
        "pointer-events-auto relative",
        asGlyph ? "w-auto" : "w-auto sm:w-64"
      )}
    >
      {asGlyph ? (
        <button
          ref={toggleRef}
          type="button"
          className={cn(glyph, "h-11 w-auto min-w-11 gap-1 px-2")}
          aria-expanded={open}
          aria-controls="conference-participants-panel"
          aria-label={`${labels.title} (${visible.length})`}
          title={labels.title}
          onClick={() => setOpen((o) => !o)}
        >
          <Users className="size-5" aria-hidden />
          <span className="text-[11px] tabular-nums" aria-hidden>
            {visible.length}
          </span>
        </button>
      ) : (
        <Button
          ref={toggleRef}
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            glassPill,
            "h-auto px-3 py-1.5 text-xs text-white hover:bg-white/20 hover:text-white"
          )}
          style={glassSurface}
          aria-expanded={open}
          aria-controls="conference-participants-panel"
          onClick={() => setOpen((o) => !o)}
        >
          {labels.title} ({visible.length})
        </Button>
      )}
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
          className={cn(
            glassMenu,
            "mt-2 w-64 p-3 text-white shadow-lg outline-none",
            // Under the pill, not inside it: in flow the list would stretch
            // the pill it lives in into a box.
            asGlyph && "absolute start-0 top-full z-30"
          )}
        >
          {visible.length === 0 ? (
            <p className="text-sm text-white/60">{labels.empty}</p>
          ) : (
            <ul className="space-y-1">
              {visible.map((p) => (
                <li
                  key={p.identity}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate text-sm text-white">
                    {p.name || p.identity}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-red-400 hover:bg-white/10 hover:text-red-300"
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
