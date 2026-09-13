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
 * The class's controls, laid out the way the reference app lays out a film's
 * (`public/apple-tv/File.png`, Abdout 2026-09-13 — "match File.png fully"):
 *
 *   File.png                        the class
 *   ⟲10 · ▶ · ⟳10  (centre discs)   camera · MICROPHONE · hand (host: share)
 *   Info · InSight · …  (capsules)  Discussion · Raised hands (host)
 *   ⋯  beside the title             quality · microphone · camera · board …
 *
 * The discs carry the three things a class does with itself; the capsules
 * open the side panel, which is where a class talks; the card holds what is
 * rarer. It replaces the row of five chosen on 2026-09-03.
 */

/** A glass disc of the transport row — the lumos overlay's own classes. */
const disc = cn(glassButton, "flex items-center justify-center text-white")

interface TransportProps {
  role: ConferenceParticipantRole
  labels: RoomLabels
  channel: ClassChannel
}

/**
 * The centre trio, at the overlay's geometry: 64 · 92 · 64 with 22px gaps on
 * a phone, 50 · 80 · 50 with 40px from `sm`. An OBSERVER publishes nothing,
 * so their screen has no transport at all — the reference shows none either
 * when there is nothing to play.
 */
export function ClassTransport({ role, labels, channel }: TransportProps) {
  if (role === "OBSERVER") return null
  const isHost = role === "HOST" || role === "CO_HOST"
  return (
    <div className="flex items-center justify-center gap-[22px] sm:gap-10">
      <CameraDisc labels={labels} />
      <MicDisc labels={labels} />
      {isHost ? (
        <ShareDisc labels={labels} />
      ) : (
        <button
          type="button"
          className={cn(disc, "size-16 sm:size-[50px]")}
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
            pt={29}
            className={cn(channel.handUp && "text-black", "sm:size-[22px]")}
          />
        </button>
      )}
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
      className={cn(disc, "size-[92px] disabled:opacity-40 sm:size-20")}
      // Muted keeps the red disc it always had: the one alarm on the frame.
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
        pt={35}
        className="sm:size-8"
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
      className={cn(
        disc,
        "size-16 disabled:opacity-40 sm:size-[50px]",
        !enabled && "text-red-400"
      )}
      style={glassSurface}
      aria-pressed={enabled}
      aria-label={enabled ? labels.camera : labels.cameraOff}
      disabled={pending}
      onClick={() => void toggle()}
    >
      <SfSymbol
        glyph={enabled ? videoFill : videoSlashFill}
        pt={26}
        className="sm:size-[22px]"
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
      className={cn(disc, "size-16 disabled:opacity-40 sm:size-[50px]")}
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
        pt={24}
        className="sm:size-[22px]"
      />
    </button>
  )
}

interface CapsulesProps {
  role: ConferenceParticipantRole
  labels: RoomLabels
  channel: ClassChannel
  panel: PanelTab | null
  onPanel: (tab: PanelTab | null) => void
  tools: RoomTools
}

/** The reference's capsule: 44px, 16px of padding, 15px semibold. */
const capsule = cn(
  glassButton,
  "relative flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-white"
)

/**
 * The capsule row, in File.png's Info · InSight · Continue Watching place.
 * Discussion opens the side panel — chat, questions, poll and hands are its
 * tabs — and carries what is waiting there; the host gets a second capsule
 * for raised hands while any are up, because calling on a student is the one
 * panel errand a teacher runs mid-sentence.
 */
export function ClassCapsules({
  role,
  labels,
  channel,
  panel,
  onPanel,
  tools,
}: CapsulesProps) {
  const isHost = role === "HOST" || role === "CO_HOST"
  const unanswered = channel.state.questions.filter((q) => !q.answered).length
  const badge = unanswered + (isHost ? channel.hands.length : 0)
  const pollOpen = Boolean(channel.state.poll?.open)
  const defaultTab: PanelTab = tools.chat ? "chat" : "questions"
  // The badge beside the word is `aria-hidden` — this is the count and state
  // a screen reader gets instead.
  const panelLabel =
    badge > 0
      ? `${labels.discussion} (${badge})`
      : pollOpen
        ? `${labels.discussion} — ${labels.pollOpenAnnounce}`
        : labels.discussion
  const hands = channel.hands.length

  return (
    <div className="no-scrollbar -mx-[21px] flex items-center gap-2 overflow-x-auto px-[21px] sm:mx-0 sm:px-0">
      <button
        type="button"
        className={cn(capsule, panel && panel !== "hands" && "bg-white/25")}
        style={glassSurface}
        aria-pressed={Boolean(panel) && panel !== "hands"}
        aria-label={panelLabel}
        onClick={() => onPanel(panel && panel !== "hands" ? null : defaultTab)}
      >
        {labels.discussion}
        {badge > 0 ? (
          <span
            className="min-w-5 rounded-full bg-amber-400 px-1.5 text-center text-[12px] leading-5 font-semibold text-black"
            aria-hidden
          >
            {badge}
          </span>
        ) : pollOpen ? (
          <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
        ) : null}
      </button>
      {isHost && tools.hands && hands > 0 && (
        <button
          type="button"
          className={cn(capsule, panel === "hands" && "bg-white/25")}
          style={glassSurface}
          aria-pressed={panel === "hands"}
          aria-label={`${labels.handsRaised} (${hands})`}
          onClick={() => onPanel(panel === "hands" ? null : "hands")}
        >
          {labels.handsRaised}
          <span
            className="min-w-5 rounded-full bg-amber-400 px-1.5 text-center text-[12px] leading-5 font-semibold text-black"
            aria-hidden
          >
            {hands}
          </span>
        </button>
      )}
    </div>
  )
}

type MoreView = "root" | "quality" | "mic" | "camera" | "slides"

interface MoreMenuProps {
  role: ConferenceParticipantRole
  labels: RoomLabels
  channel: ClassChannel
  slides: SlideOption[]
  tools: RoomTools
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
 * the host's board and slides. A drill-in swaps the card's rows for the list
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
  tools,
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
  const isStudent = role === "PARTICIPANT"
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
              {isHost && tools.whiteboard && (
                <ChoiceRow
                  glyph={pencilAndScribble}
                  label={labels.whiteboard}
                  selected={channel.state.whiteboard}
                  onClick={() => {
                    close()
                    void channel.send({
                      t: "wb.show",
                      on: !channel.state.whiteboard,
                    })
                  }}
                />
              )}
              {isHost && (
                <DrillRow
                  glyph={docRichtext}
                  label={labels.slides}
                  onClick={() => setView("slides")}
                />
              )}
              {isStudent && tools.studentShare && (
                <StudentShareRow labels={labels} onDone={close} />
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

function StudentShareRow({
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
    <ChoiceRow
      glyph={rectangleInsetFilledAndPersonFilled}
      label={enabled ? labels.stopShare : labels.screenShare}
      selected={enabled}
      disabled={pending}
      onClick={() => {
        onDone()
        void toggle()
      }}
    />
  )
}
