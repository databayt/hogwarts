"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { useMediaDeviceSelect, useTrackToggle } from "@livekit/components-react"
import { Track } from "livekit-client"
import {
  Hand,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  SignalHigh,
  Video,
  VideoOff,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { glassMenu } from "@/components/lumos/shared/video-player/glass"
import type {
  ConferenceParticipantRole,
  RoomTools,
} from "@/components/school-dashboard/live/types"

import { DELIVERY_TIERS, type DeliveryTier } from "./adaptive-delivery"
import { glyph, glyphLarge } from "./glyph"
import type { RoomLabels } from "./labels"
import { QUALITY_TONE } from "./overlays"
import type { PanelTab } from "./side-panel"
import type { SlideOption } from "./slide-options"
import type { AdaptiveDelivery } from "./use-adaptive-delivery"
import type { ClassChannel } from "./use-class-channel"

interface ControlBarProps {
  role: ConferenceParticipantRole
  labels: RoomLabels
  channel: ClassChannel
  panel: PanelTab | null
  onPanel: (tab: PanelTab | null) => void
  slides: SlideOption[]
  tools: RoomTools
  /** Whether a menu of ours is open — the chrome must not auto-hide under
   *  a list the reader is choosing from. */
  onPinned?: (pinned: boolean) => void
}

/**
 * The player's row of five, on a class. The reference draws AirPlay, back
 * fifteen, pause, forward fifteen and captions; none of those means anything
 * in a room, so the row keeps the SHAPE — five bare glyphs, the middle one
 * larger — and takes the class's own actions:
 *
 *   discussion · camera · MICROPHONE · hand (host: share) · more
 *
 * The microphone is the centre because it is the control a class reaches for
 * most, the way pause is in a film. Chat, questions, poll and raised hands are
 * four tabs of ONE side panel, so one button opens it and carries the count —
 * that is what lets the row fit a phone in a single line, where the old two
 * clusters wrapped onto two. Everything rarer lives under `⋯`.
 *
 * Every string is from the dictionary and every control is wired to a real
 * capability; the SDK's prebuilt bar (hardcoded English, forced LTR) stays
 * retired.
 */
export function ControlBar({
  role,
  labels,
  channel,
  panel,
  onPanel,
  slides,
  tools,
  onPinned,
}: ControlBarProps) {
  const canPublish = role !== "OBSERVER"
  const isHost = role === "HOST" || role === "CO_HOST"
  const isStudent = role === "PARTICIPANT"
  const [more, setMore] = useState(false)
  useEffect(() => {
    onPinned?.(more)
  }, [more, onPinned])

  // What the panel button has to say before it is opened: questions nobody
  // has answered, plus — for the host, who is the one to call on them — the
  // hands that are up. An open poll with nothing else pending shows as a dot.
  const unanswered = channel.state.questions.filter((q) => !q.answered).length
  const badge = unanswered + (isHost ? channel.hands.length : 0)
  const pollOpen = Boolean(channel.state.poll?.open)
  const defaultTab: PanelTab = tools.chat ? "chat" : "questions"
  // The visual badge/dot beside the icon is `aria-hidden` — this is the
  // count and state a screen reader gets instead, since the button's own
  // label never otherwise changes with what is pending.
  const panelLabel =
    badge > 0
      ? `${labels.discussion} (${badge})`
      : pollOpen
        ? `${labels.discussion} — ${labels.pollOpenAnnounce}`
        : labels.discussion

  return (
    // Five slots spread across the card. An OBSERVER publishes nothing and
    // has nothing under `⋯`, so their row is the one button, centred.
    <div
      className={cn(
        "flex items-center",
        canPublish ? "justify-between" : "justify-center"
      )}
    >
      <button
        type="button"
        className={cn(glyph, "relative", panel && "bg-white/25")}
        aria-pressed={Boolean(panel)}
        aria-label={panelLabel}
        onClick={() => onPanel(panel ? null : defaultTab)}
      >
        <MessageSquare className="size-6" aria-hidden />
        {badge > 0 ? (
          <span
            className="absolute -end-0.5 -top-0.5 min-w-4 rounded-full bg-amber-400 px-1 text-center text-[10px] leading-4 font-semibold text-black"
            aria-hidden
          >
            {badge}
          </span>
        ) : pollOpen ? (
          <span
            className="absolute end-1 top-1 size-2 rounded-full bg-emerald-400"
            aria-hidden
          />
        ) : null}
      </button>

      {canPublish && <CameraButton labels={labels} />}
      {canPublish && <MicButton labels={labels} large />}
      {canPublish &&
        (isHost ? (
          <ShareButton labels={labels} />
        ) : (
          <button
            type="button"
            className={cn(
              glyph,
              channel.handUp && "bg-amber-400 text-black hover:bg-amber-300"
            )}
            aria-pressed={channel.handUp}
            aria-label={channel.handUp ? labels.lowerHand : labels.raiseHand}
            onClick={() => void channel.setHand(!channel.handUp)}
          >
            <Hand className="size-6" aria-hidden />
          </button>
        ))}

      {canPublish && (
        <div className="relative" data-menu-root>
          <button
            type="button"
            className={cn(glyph, more && "bg-white/25")}
            aria-haspopup="menu"
            aria-expanded={more}
            aria-label={labels.more}
            onClick={() => setMore((m) => !m)}
          >
            <MoreHorizontal className="size-6" aria-hidden />
          </button>
          {more && (
            <Menu
              onClose={() => setMore(false)}
              placement="up"
              align="end"
              wide
            >
              {isHost && tools.whiteboard && (
                <MenuItem
                  selected={channel.state.whiteboard}
                  onClick={() => {
                    setMore(false)
                    void channel.send({
                      t: "wb.show",
                      on: !channel.state.whiteboard,
                    })
                  }}
                >
                  {channel.state.whiteboard
                    ? labels.hideWhiteboard
                    : labels.whiteboard}
                </MenuItem>
              )}
              {isHost && (
                <>
                  <MenuNote>{labels.pickSlides}</MenuNote>
                  {slides.length === 0 && (
                    <MenuNote>{labels.noSlides}</MenuNote>
                  )}
                  {slides.map((s) => (
                    <MenuItem
                      key={s.id}
                      onClick={() => {
                        setMore(false)
                        void channel.send({
                          t: "slides",
                          slides: { url: s.url, title: s.title, page: 1 },
                        })
                      }}
                    >
                      {s.title}
                    </MenuItem>
                  ))}
                  {channel.state.slides && (
                    <MenuItem
                      onClick={() => {
                        setMore(false)
                        void channel.send({ t: "slides", slides: null })
                      }}
                    >
                      {labels.stopSlides}
                    </MenuItem>
                  )}
                </>
              )}
              {/* A student the school lets share reaches it here: the row's
                  fourth slot is their hand, which they need more often. */}
              {isStudent && tools.studentShare && (
                <ShareMenuItem labels={labels} onDone={() => setMore(false)} />
              )}
              <MenuNote>{labels.settings}</MenuNote>
              <DeviceSelect kind="audioinput" label={labels.mic} />
              <DeviceSelect kind="videoinput" label={labels.camera} />
              <MenuNote>{labels.attendanceAuto}</MenuNote>
            </Menu>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The top-end pill's one glyph — where the reference keeps volume, which a
 * phone has a rocker for. The connection is what a class actually needs to
 * see at a glance: the signal tinted by the last sample, and the delivery
 * tiers under it.
 */
export function QualityMenuButton({
  adaptive,
  labels,
  onPinned,
}: {
  adaptive: AdaptiveDelivery
  labels: RoomLabels
  onPinned?: (pinned: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    onPinned?.(open)
  }, [open, onPinned])
  const q = adaptive.quality
  const text =
    q === "excellent"
      ? labels.excellent
      : q === "good"
        ? labels.good
        : q === "poor"
          ? labels.poor
          : q === "lost"
            ? labels.lost
            : "—"
  return (
    <div className="relative" data-menu-root>
      <button
        type="button"
        className={cn(glyph, adaptive.manual && "bg-white/25")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${labels.connection}: ${text} · ${labels.quality}`}
        title={`${labels.connection}: ${text}`}
        onClick={() => setOpen((o) => !o)}
      >
        <SignalHigh className={cn("size-5", QUALITY_TONE[q])} aria-hidden />
      </button>
      {open && (
        <Menu onClose={() => setOpen(false)} placement="down" align="end">
          <MenuItem
            selected={adaptive.manual === null}
            onClick={() => {
              adaptive.setManual(null)
              setOpen(false)
            }}
          >
            {labels.qualityAuto} ({tierLabel(adaptive.tier, labels)})
          </MenuItem>
          {DELIVERY_TIERS.map((t) => (
            <MenuItem
              key={t}
              selected={adaptive.manual === t}
              onClick={() => {
                adaptive.setManual(t)
                setOpen(false)
              }}
            >
              {tierLabel(t, labels)}
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  )
}

export function tierLabel(t: DeliveryTier, labels: RoomLabels): string {
  return t === "high"
    ? labels.qualityHigh
    : t === "medium"
      ? labels.qualityMedium
      : t === "low"
        ? labels.qualityLow
        : labels.qualityAudio
}

function MicButton({ labels, large }: { labels: RoomLabels; large?: boolean }) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.Microphone,
  })
  return (
    <button
      type="button"
      className={cn(
        glyph,
        large && glyphLarge,
        !enabled && "bg-red-600/80 hover:bg-red-500"
      )}
      aria-pressed={enabled}
      aria-label={enabled ? labels.mic : labels.micMuted}
      disabled={pending}
      onClick={() => void toggle()}
    >
      {enabled ? (
        <Mic className={large ? "size-7" : "size-6"} aria-hidden />
      ) : (
        <MicOff className={large ? "size-7" : "size-6"} aria-hidden />
      )}
    </button>
  )
}

function CameraButton({ labels }: { labels: RoomLabels }) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.Camera,
  })
  return (
    <button
      type="button"
      // A bare glyph, like every control on the frame but the centre one:
      // the muted MIC keeps its red disc, the camera only tints its slash.
      className={cn(glyph, !enabled && "text-red-400")}
      aria-pressed={enabled}
      aria-label={enabled ? labels.camera : labels.cameraOff}
      disabled={pending}
      onClick={() => void toggle()}
    >
      {enabled ? (
        <Video className="size-6" aria-hidden />
      ) : (
        <VideoOff className="size-6" aria-hidden />
      )}
    </button>
  )
}

function ShareButton({ labels }: { labels: RoomLabels }) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.ScreenShare,
  })
  return (
    <button
      type="button"
      className={cn(glyph, enabled && "bg-sky-600 hover:bg-sky-500")}
      aria-pressed={enabled}
      aria-label={enabled ? labels.stopShare : labels.screenShare}
      disabled={pending}
      onClick={() => void toggle()}
    >
      <MonitorUp className="size-6" aria-hidden />
    </button>
  )
}

function ShareMenuItem({
  labels,
  onDone,
}: {
  labels: RoomLabels
  onDone: () => void
}) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.ScreenShare,
  })
  return (
    <MenuItem
      selected={enabled}
      disabled={pending}
      onClick={() => {
        onDone()
        void toggle()
      }}
    >
      {enabled ? labels.stopShare : labels.screenShare}
    </MenuItem>
  )
}

function DeviceSelect({
  kind,
  label,
}: {
  kind: "audioinput" | "videoinput"
  label: string
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } =
    useMediaDeviceSelect({ kind })
  return (
    <label className="block px-3 py-1 text-xs">
      <span className="mb-1 block text-white/60">{label}</span>
      <select
        className="w-full rounded-md border border-white/20 bg-black/60 px-2 py-1 text-white"
        value={activeDeviceId}
        onChange={(e) => void setActiveMediaDevice(e.target.value)}
      >
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || d.deviceId}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * A list floating off one of the glyphs. Closed by a press anywhere outside
 * its own `data-menu-root` (the glyph and the list together, so the glyph's
 * own press toggles rather than fighting the close) or by Escape — a document
 * listener, NOT a fixed full-screen catcher: the glass this sits on has a
 * `backdrop-filter`, which makes it the containing block of anything `fixed`
 * inside it, and a catcher the size of the card catches nothing.
 */
function Menu({
  children,
  onClose,
  placement,
  align,
  wide,
}: {
  children: React.ReactNode
  onClose: () => void
  placement: "up" | "down"
  align: "start" | "end"
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const root = ref.current?.closest("[data-menu-root]")
      const target = e.target as Element | null
      if (root && target && !root.contains(target)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose])
  return (
    <div
      ref={ref}
      role="menu"
      className={cn(
        glassMenu,
        "absolute z-30 max-h-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto py-1 shadow-xl",
        placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
        wide ? "w-64" : "min-w-44"
      )}
      style={align === "end" ? { insetInlineEnd: 0 } : { insetInlineStart: 0 }}
    >
      {children}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  selected,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  selected?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role={selected === undefined ? "menuitem" : "menuitemradio"}
      aria-checked={selected === undefined ? undefined : selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "block w-full truncate px-3 py-1.5 text-start text-sm text-white hover:bg-white/10 disabled:opacity-40",
        selected && "font-semibold"
      )}
    >
      {children}
    </button>
  )
}

/** A line in a menu that is read, not pressed — a heading or a footnote. */
function MenuNote({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-1 text-xs text-white/60">{children}</div>
}
