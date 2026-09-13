"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { useMediaDeviceSelect, useTrackToggle } from "@livekit/components-react"
import { Track } from "livekit-client"

import { cn } from "@/lib/utils"
import {
  glassButton,
  glassSurface,
  phoneMenuCard,
  phoneMenuRow,
} from "@/components/lumos/shared/video-player/glass"
import {
  bubbleLeftAndBubbleRightFill,
  cellularbars,
  checkmark,
  chevronLeft,
  chevronRight,
  docRichtext,
  ellipsis,
  handRaisedFill,
  micFill,
  micSlashFill,
  pencilAndScribble,
  rectangleInsetFilledAndPersonFilled,
  SfSymbol,
  video,
  videoFill,
  videoSlashFill,
  waveform,
} from "@/components/lumos/shared/video-player/sf-symbols"
import type {
  ConferenceParticipantRole,
  RoomTools,
} from "@/components/school-dashboard/live/types"

import { DELIVERY_TIERS, type DeliveryTier } from "./adaptive-delivery"
import type { RoomLabels } from "./labels"
import { QUALITY_TONE } from "./overlays"
import type { PanelTab } from "./side-panel"
import type { SlideOption } from "./slide-options"
import type { AdaptiveDelivery } from "./use-adaptive-delivery"
import type { ClassChannel } from "./use-class-channel"

/**
 * The class's controls: ONE row of equal glass discs along the bottom of the
 * call (Abdout, 2026-09-13 — "camera, mic, hand, blackboard and the rest, in
 * a row at the bottom, all the same size", in place of the Discussion capsule
 * and the centre trio that sat over the picture).
 *
 *   camera · mic · hand · board (host) · share · discussion
 *
 * The rarer things — quality, device selects, slides — stay in the ⋯ card
 * beside the title.
 */

/** Every disc in the row: 48px on a phone, 40px from `sm`. */
const disc = cn(
  glassButton,
  "relative flex size-12 shrink-0 items-center justify-center text-white disabled:opacity-40 sm:size-10"
)
/** Every glyph in the row, at one point size. */
const GLYPH_PT = 22
const glyphClass = "sm:size-[18px]"
/** A disc that is switched on — inline, because `glassSurface` sets the
 *  background inline and would beat a `bg-*` class. */
const onSurface = { ...glassSurface, background: "rgba(255, 255, 255, 0.25)" }

/** The count in a disc's corner. Always `aria-hidden` — the disc's label
 *  carries the same number for a screen reader. */
function CountBadge({ count }: { count: number }) {
  return (
    <span
      className="absolute -end-1 -top-1 min-w-5 rounded-full bg-amber-400 px-1.5 text-center text-[12px] leading-5 font-semibold text-black"
      aria-hidden
    >
      {count}
    </span>
  )
}

interface ControlsProps {
  role: ConferenceParticipantRole
  labels: RoomLabels
  channel: ClassChannel
  panel: PanelTab | null
  onPanel: (tab: PanelTab | null) => void
  tools: RoomTools
}

/**
 * An OBSERVER publishes nothing, so their row is the discussion disc alone —
 * and mounts no LiveKit track hook.
 */
export function ClassControls({
  role,
  labels,
  channel,
  panel,
  onPanel,
  tools,
}: ControlsProps) {
  const isHost = role === "HOST" || role === "CO_HOST"
  const canPublish = role !== "OBSERVER"
  const unanswered = channel.state.questions.filter((q) => !q.answered).length
  const hands = channel.hands.length
  // The host's hands have their own disc when the tool is on; otherwise they
  // still count on the discussion disc, whose panel lists them.
  const badge = unanswered + (isHost && !tools.hands ? hands : 0)
  const pollOpen = Boolean(channel.state.poll?.open)
  const defaultTab: PanelTab = tools.chat ? "chat" : "questions"
  const discussionOpen = Boolean(panel) && panel !== "hands"
  const discussionLabel =
    badge > 0
      ? `${labels.discussion} (${badge})`
      : pollOpen
        ? `${labels.discussion} — ${labels.pollOpenAnnounce}`
        : labels.discussion

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-2">
      {canPublish && <CameraDisc labels={labels} />}
      {canPublish && <MicDisc labels={labels} />}
      {canPublish && !isHost && (
        <button
          type="button"
          className={disc}
          style={
            channel.handUp
              ? { ...glassSurface, background: "rgb(251 191 36 / 0.9)" }
              : glassSurface
          }
          aria-pressed={channel.handUp}
          aria-label={channel.handUp ? labels.lowerHand : labels.raiseHand}
          onClick={() => void channel.setHand(!channel.handUp)}
        >
          <SfSymbol
            glyph={handRaisedFill}
            pt={GLYPH_PT}
            className={cn(glyphClass, channel.handUp && "text-black")}
          />
        </button>
      )}
      {isHost && tools.hands && (
        <button
          type="button"
          className={disc}
          style={panel === "hands" ? onSurface : glassSurface}
          aria-pressed={panel === "hands"}
          aria-label={
            hands > 0 ? `${labels.handsRaised} (${hands})` : labels.handsRaised
          }
          onClick={() => onPanel(panel === "hands" ? null : "hands")}
        >
          <SfSymbol
            glyph={handRaisedFill}
            pt={GLYPH_PT}
            className={glyphClass}
          />
          {hands > 0 && <CountBadge count={hands} />}
        </button>
      )}
      {isHost && tools.whiteboard && (
        <button
          type="button"
          className={disc}
          style={channel.state.whiteboard ? onSurface : glassSurface}
          aria-pressed={channel.state.whiteboard}
          aria-label={
            channel.state.whiteboard ? labels.hideWhiteboard : labels.whiteboard
          }
          onClick={() =>
            void channel.send({ t: "wb.show", on: !channel.state.whiteboard })
          }
        >
          <SfSymbol
            glyph={pencilAndScribble}
            pt={GLYPH_PT}
            className={glyphClass}
          />
        </button>
      )}
      {(isHost || (role === "PARTICIPANT" && tools.studentShare)) && (
        <ShareDisc labels={labels} />
      )}
      <button
        type="button"
        className={disc}
        style={discussionOpen ? onSurface : glassSurface}
        aria-pressed={discussionOpen}
        aria-label={discussionLabel}
        onClick={() => onPanel(discussionOpen ? null : defaultTab)}
      >
        <SfSymbol
          glyph={bubbleLeftAndBubbleRightFill}
          pt={GLYPH_PT}
          className={glyphClass}
        />
        {badge > 0 ? (
          <CountBadge count={badge} />
        ) : pollOpen ? (
          <span
            className="absolute end-0.5 top-0.5 size-2.5 rounded-full bg-emerald-400"
            aria-hidden
          />
        ) : null}
      </button>
    </div>
  )
}

function MicDisc({ labels }: { labels: RoomLabels }) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.Microphone,
  })
  return (
    <button
      type="button"
      className={disc}
      // Muted keeps the red disc it always had: the one alarm in the row.
      style={
        enabled
          ? glassSurface
          : { ...glassSurface, background: "rgb(220 38 38 / 0.85)" }
      }
      aria-pressed={enabled}
      aria-label={enabled ? labels.mic : labels.micMuted}
      disabled={pending}
      onClick={() => void toggle()}
    >
      <SfSymbol
        glyph={enabled ? micFill : micSlashFill}
        pt={GLYPH_PT}
        className={glyphClass}
      />
    </button>
  )
}

function CameraDisc({ labels }: { labels: RoomLabels }) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.Camera,
  })
  return (
    <button
      type="button"
      // The camera tints its glyph when off rather than lighting a second
      // red disc beside the microphone's.
      className={cn(disc, !enabled && "text-red-400")}
      style={glassSurface}
      aria-pressed={enabled}
      aria-label={enabled ? labels.camera : labels.cameraOff}
      disabled={pending}
      onClick={() => void toggle()}
    >
      <SfSymbol
        glyph={enabled ? videoFill : videoSlashFill}
        pt={GLYPH_PT}
        className={glyphClass}
      />
    </button>
  )
}

function ShareDisc({ labels }: { labels: RoomLabels }) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.ScreenShare,
  })
  return (
    <button
      type="button"
      className={disc}
      style={
        enabled
          ? { ...glassSurface, background: "rgb(2 132 199 / 0.9)" }
          : glassSurface
      }
      aria-pressed={enabled}
      aria-label={enabled ? labels.stopShare : labels.screenShare}
      disabled={pending}
      onClick={() => void toggle()}
    >
      <SfSymbol
        glyph={rectangleInsetFilledAndPersonFilled}
        pt={GLYPH_PT}
        className={glyphClass}
      />
    </button>
  )
}

type MoreView = "root" | "quality" | "mic" | "camera" | "slides"

interface MoreMenuProps {
  role: ConferenceParticipantRole
  labels: RoomLabels
  channel: ClassChannel
  slides: SlideOption[]
  adaptive: AdaptiveDelivery
  /** Whether the card is open — the chrome must not auto-hide under it. */
  onPinned?: (pinned: boolean) => void
}

/** How tall a drill-in list may grow before it scrolls — the lumos player's
 *  five rows and a sliver, so the card stops at the transport row. */
const LIST_MAX = 219

/**
 * The reference's "…" beside the title, and its card (`IMG_2639.PNG`):
 * drill-in rows of symbol · label · chevron, where the film's Playback Speed
 * · Audio · Subtitles become the class's Quality · Microphone · Camera, then
 * the host's slides (the board and screen share live in the row). A drill-in swaps the card's rows for the list
 * behind it, with a back row on top, rather than stacking a second card.
 *
 * It opens UPWARD over the title and stops above the clock, exactly where the
 * lumos player's card stops.
 */
export function ClassMoreMenu({
  role,
  labels,
  channel,
  slides,
  adaptive,
  onPinned,
}: MoreMenuProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<MoreView>("root")
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    onPinned?.(open)
  }, [open, onPinned])

  // Closed by a press outside the button+card or by Escape — a document
  // listener, not a fixed catcher: glass has a `backdrop-filter`, which makes
  // it the containing block of anything `fixed` inside it.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const canPublish = role !== "OBSERVER"
  const isHost = role === "HOST" || role === "CO_HOST"
  const close = () => setOpen(false)
  const q = adaptive.quality
  const qualityText =
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
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className={cn(glassButton, "flex size-11 items-center justify-center")}
        style={glassSurface}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={labels.more}
        onClick={() => {
          setView("root")
          setOpen((o) => !o)
        }}
      >
        <SfSymbol glyph={ellipsis} pt={18} className="text-white" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            phoneMenuCard,
            "absolute -end-2 -bottom-[9px] z-30 overflow-hidden"
          )}
        >
          {view === "root" ? (
            <>
              <DrillRow
                glyph={cellularbars}
                glyphClass={QUALITY_TONE[q]}
                label={labels.quality}
                value={qualityText}
                onClick={() => setView("quality")}
              />
              {canPublish && (
                <DrillRow
                  glyph={waveform}
                  label={labels.mic}
                  onClick={() => setView("mic")}
                />
              )}
              {canPublish && (
                <DrillRow
                  glyph={video}
                  label={labels.camera}
                  onClick={() => setView("camera")}
                />
              )}
              {isHost && (
                <DrillRow
                  glyph={docRichtext}
                  label={labels.slides}
                  onClick={() => setView("slides")}
                />
              )}
              <p className="px-8 pt-1 pb-1.5 text-[13px] leading-snug text-white/50">
                {labels.attendanceAuto}
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                className={cn(
                  phoneMenuRow,
                  "text-[15px] text-white/60 active:bg-white/10"
                )}
                onClick={() => setView("root")}
              >
                <SfSymbol
                  glyph={chevronLeft}
                  pt={12}
                  className="w-[17px] rtl:rotate-180"
                />
                <span className="flex-1 truncate">{labels.back}</span>
              </button>
              <div
                className="overflow-y-auto overscroll-contain"
                style={{ maxHeight: LIST_MAX }}
              >
                {view === "quality" && (
                  <>
                    <ChoiceRow
                      label={`${labels.qualityAuto} (${tierLabel(adaptive.tier, labels)})`}
                      selected={adaptive.manual === null}
                      onClick={() => {
                        adaptive.setManual(null)
                        close()
                      }}
                    />
                    {DELIVERY_TIERS.map((t) => (
                      <ChoiceRow
                        key={t}
                        label={tierLabel(t, labels)}
                        selected={adaptive.manual === t}
                        onClick={() => {
                          adaptive.setManual(t)
                          close()
                        }}
                      />
                    ))}
                  </>
                )}
                {view === "mic" && (
                  <DeviceRows kind="audioinput" onDone={close} />
                )}
                {view === "camera" && (
                  <DeviceRows kind="videoinput" onDone={close} />
                )}
                {view === "slides" && (
                  <>
                    {slides.length === 0 && (
                      <p className="px-8 py-2 text-[15px] text-white/50">
                        {labels.noSlides}
                      </p>
                    )}
                    {slides.map((s) => (
                      <ChoiceRow
                        key={s.id}
                        label={s.title}
                        selected={channel.state.slides?.url === s.url}
                        onClick={() => {
                          close()
                          void channel.send({
                            t: "slides",
                            slides: { url: s.url, title: s.title, page: 1 },
                          })
                        }}
                      />
                    ))}
                    {channel.state.slides && (
                      <ChoiceRow
                        label={labels.stopSlides}
                        onClick={() => {
                          close()
                          void channel.send({ t: "slides", slides: null })
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
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

/** A row that opens a list: symbol · label · (value) · chevron. */
function DrillRow({
  glyph,
  glyphClass,
  label,
  value,
  onClick,
}: {
  glyph: typeof waveform
  glyphClass?: string
  label: string
  value?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(phoneMenuRow, "active:bg-white/10")}
      onClick={onClick}
    >
      <SfSymbol glyph={glyph} pt={17} className={cn("w-[17px]", glyphClass)} />
      <span className="flex-1 truncate">{label}</span>
      {value && <span className="text-[15px] text-white/50">{value}</span>}
      <SfSymbol
        glyph={chevronRight}
        pt={12}
        className="text-white/60 rtl:rotate-180"
      />
    </button>
  )
}

/** A row that does something, with the reference's checkmark when on. */
function ChoiceRow({
  glyph,
  label,
  selected,
  disabled,
  onClick,
}: {
  glyph?: typeof waveform
  label: string
  selected?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role={selected === undefined ? "menuitem" : "menuitemradio"}
      aria-checked={selected}
      disabled={disabled}
      className={cn(
        phoneMenuRow,
        "active:bg-white/10 disabled:opacity-40",
        selected && "font-semibold"
      )}
      onClick={onClick}
    >
      {glyph && <SfSymbol glyph={glyph} pt={17} className="w-[17px]" />}
      <span className="flex-1 truncate">{label}</span>
      {selected && <SfSymbol glyph={checkmark} pt={15} />}
    </button>
  )
}

function DeviceRows({
  kind,
  onDone,
}: {
  kind: "audioinput" | "videoinput"
  onDone: () => void
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } =
    useMediaDeviceSelect({ kind })
  return (
    <>
      {devices.map((d) => (
        <ChoiceRow
          key={d.deviceId}
          label={d.label || d.deviceId}
          selected={d.deviceId === activeDeviceId}
          onClick={() => {
            void setActiveMediaDevice(d.deviceId)
            onDone()
          }}
        />
      ))}
    </>
  )
}
