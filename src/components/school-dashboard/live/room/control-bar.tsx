"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { useMediaDeviceSelect, useTrackToggle } from "@livekit/components-react"
import { Track } from "livekit-client"

import { cn } from "@/lib/utils"
import {
  glassButton,
  glassPill,
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
  faceSmiling,
  handRaisedFill,
  handRaisedSlashFill,
  micFill,
  micSlash,
  micSlashFill,
  pauseFill,
  pencilAndScribble,
  person2BadgeGearshapeFill,
  playFill,
  rectangleInsetFilledAndPersonFilled,
  SfSymbol,
  sparkles,
  stopFill,
  timer as timerGlyph,
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
import { REACTIONS, timerLeft } from "./class-channel"
import { formatClock, timerDone, useTimerNow } from "./class-timer"
import type { RoomLabels } from "./labels"
import { QUALITY_TONE } from "./overlays"
import type { PanelTab } from "./side-panel"
import type { SlideOption } from "./slide-options"
import type { AdaptiveDelivery } from "./use-adaptive-delivery"
import type { ClassChannel } from "./use-class-channel"

/**
 * The class's controls: ONE row of equal glass discs along the bottom of the
 * call (Abdout, 2026-09-13 — "camera, mic, hand, blackboard and the rest, in
 * a row at the bottom, all the same size").
 *
 *   host:     camera · mic · hands · board · class tools · share* · discussion
 *   student:  camera · mic · hand · react · share* · discussion
 *   observer: react · discussion
 *
 * *share only where the browser can capture a screen — no phone can, so the
 * row stays six discs at 390px. The rarer things — quality, device selects,
 * slides — stay in the ⋯ card beside the title.
 *
 * ONE size everywhere (Abdout, 2026-10-17: "icons same size in mobile and
 * desktop"): 48px discs, 22pt glyphs, at every width.
 */

/** Every disc in the row: 48px at every width. */
const disc = cn(
  glassButton,
  "relative flex size-12 shrink-0 items-center justify-center text-white disabled:opacity-40"
)
/** Every glyph in the row, at one point size. */
const GLYPH_PT = 22
/** A disc that is switched on — inline, because `glassSurface` sets the
 *  background inline and would beat a `bg-*` class. */
const onSurface = { ...glassSurface, background: "rgba(255, 255, 255, 0.25)" }
/** The raised hand's amber. */
const handSurface = { ...glassSurface, background: "rgb(251 191 36 / 0.95)" }

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

/** Can this browser capture a screen? Read once, after hydration. */
const noop = () => () => {}
function useCanShareScreen(): boolean {
  return useSyncExternalStore(
    noop,
    () =>
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getDisplayMedia === "function",
    () => true
  )
}

/** Close a popover on a press outside `root` or on Escape — a document
 *  listener, not a fixed catcher (glass makes `fixed` relative to itself). */
function useDismiss(
  open: boolean,
  root: React.RefObject<HTMLElement | null>,
  close: () => void
) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, root, close])
}

/** The card a row popover opens as: above the row, centred on the row. */
const popCard = cn(
  "absolute bottom-full left-1/2 z-30 mb-3 -translate-x-1/2 rounded-[28px] bg-[#121212]/95 p-2 text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-[40px]"
)

function ReactionStrip({
  channel,
  labels,
}: {
  channel: ClassChannel
  labels: RoomLabels
}) {
  return (
    <div role="group" aria-label={labels.reactions} className="flex gap-1">
      {REACTIONS.map((e) => (
        <button
          key={e}
          type="button"
          className="flex size-11 items-center justify-center rounded-full text-[26px] transition-transform hover:bg-white/10 active:scale-125"
          aria-label={`${labels.react} ${e}`}
          onClick={() => channel.sendReaction(e)}
        >
          {e}
        </button>
      ))}
    </div>
  )
}

interface ControlsProps {
  role: ConferenceParticipantRole
  labels: RoomLabels
  channel: ClassChannel
  panel: PanelTab | null
  onPanel: (tab: PanelTab | null) => void
  tools: RoomTools
  /** Others' chat messages not yet seen — counted on the discussion disc. */
  chatUnread?: number
  /** A popover in the row is open — the chrome must not auto-hide under it. */
  onPinned?: (pinned: boolean) => void
  /** Host: mute every student. */
  onMuteAll?: () => void
}

type Pop = "react" | "tools" | null

/**
 * An OBSERVER publishes nothing, so their row is react + discussion — and
 * mounts no LiveKit track hook.
 */
export function ClassControls({
  role,
  labels,
  channel,
  panel,
  onPanel,
  tools,
  chatUnread = 0,
  onPinned,
  onMuteAll,
}: ControlsProps) {
  const isHost = role === "HOST" || role === "CO_HOST"
  const canPublish = role !== "OBSERVER"
  const canShareScreen = useCanShareScreen()
  const unanswered = channel.state.questions.filter((q) => !q.answered).length
  const hands = channel.hands.length
  const myPlace = channel.hands.indexOf(channel.localIdentity) + 1
  // The host's hands have their own disc when the tool is on; otherwise they
  // still count on the discussion disc, whose panel lists them.
  const badge = unanswered + chatUnread + (isHost && !tools.hands ? hands : 0)
  const pollOpen = Boolean(channel.state.poll?.open)
  const defaultTab: PanelTab = tools.chat ? "chat" : "questions"
  const discussionOpen = Boolean(panel) && panel !== "hands"
  const discussionLabel =
    badge > 0
      ? `${labels.discussion} (${badge})`
      : pollOpen
        ? `${labels.discussion} — ${labels.pollOpenAnnounce}`
        : labels.discussion

  const [pop, setPop] = useState<Pop>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const closePop = useCallback(() => setPop(null), [])
  useDismiss(pop !== null, rowRef, closePop)
  useEffect(() => {
    onPinned?.(pop !== null)
  }, [pop, onPinned])
  const togglePop = (p: Pop) => setPop((cur) => (cur === p ? null : p))

  const showShare =
    canShareScreen && (isHost || (role === "PARTICIPANT" && tools.studentShare))

  return (
    <div
      ref={rowRef}
      className="relative flex items-center justify-center gap-2.5"
    >
      {/* The student's place in line, over the row while the hand is up. */}
      {!isHost && channel.handUp && myPlace > 0 && pop === null && (
        <p
          className={cn(
            glassPill,
            "pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 px-3.5 py-1.5 text-[15px] font-medium whitespace-nowrap text-white"
          )}
          style={{ ...glassSurface, background: "rgba(20, 20, 20, 0.7)" }}
          aria-live="polite"
        >
          ✋ {labels.handInLine.replace("{n}", String(myPlace))}
        </p>
      )}

      {canPublish && <CameraDisc labels={labels} />}
      {canPublish && <MicDisc labels={labels} />}
      {canPublish && !isHost && (
        <button
          type="button"
          className={cn(disc, channel.handUp && "text-black")}
          style={channel.handUp ? handSurface : glassSurface}
          aria-pressed={channel.handUp}
          aria-label={channel.handUp ? labels.lowerHand : labels.raiseHand}
          onClick={() => {
            const up = !channel.handUp
            if (up) navigator.vibrate?.(12)
            void channel.setHand(up)
          }}
        >
          {/* A soft ring breathes round a raised hand, so the student can
              see at a glance that it is still up. */}
          {channel.handUp && (
            <span
              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-amber-300 motion-safe:animate-ping"
              aria-hidden
            />
          )}
          <SfSymbol glyph={handRaisedFill} pt={GLYPH_PT} />
        </button>
      )}
      {isHost && tools.hands && (
        <button
          type="button"
          className={cn(
            disc,
            hands > 0 && panel !== "hands" && "text-amber-300"
          )}
          style={panel === "hands" ? onSurface : glassSurface}
          aria-pressed={panel === "hands"}
          aria-label={
            hands > 0 ? `${labels.handsRaised} (${hands})` : labels.handsRaised
          }
          onClick={() => onPanel(panel === "hands" ? null : "hands")}
        >
          <SfSymbol glyph={handRaisedFill} pt={GLYPH_PT} />
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
          <SfSymbol glyph={pencilAndScribble} pt={GLYPH_PT} />
        </button>
      )}
      {!isHost && (
        <button
          type="button"
          className={disc}
          style={pop === "react" ? onSurface : glassSurface}
          aria-haspopup="true"
          aria-expanded={pop === "react"}
          aria-label={labels.react}
          onClick={() => togglePop("react")}
        >
          <SfSymbol glyph={faceSmiling} pt={GLYPH_PT} />
        </button>
      )}
      {isHost && (
        <button
          type="button"
          className={disc}
          style={pop === "tools" ? onSurface : glassSurface}
          aria-haspopup="true"
          aria-expanded={pop === "tools"}
          aria-label={labels.classTools}
          onClick={() => togglePop("tools")}
        >
          <SfSymbol glyph={sparkles} pt={GLYPH_PT} />
          {channel.state.timer?.running && (
            <span
              className="absolute end-0.5 top-0.5 size-2.5 rounded-full bg-sky-400"
              aria-hidden
            />
          )}
        </button>
      )}
      {showShare && <ShareDisc labels={labels} />}
      <button
        type="button"
        className={disc}
        style={discussionOpen ? onSurface : glassSurface}
        aria-pressed={discussionOpen}
        aria-label={discussionLabel}
        onClick={() => onPanel(discussionOpen ? null : defaultTab)}
      >
        <SfSymbol glyph={bubbleLeftAndBubbleRightFill} pt={GLYPH_PT} />
        {badge > 0 ? (
          <CountBadge count={badge} />
        ) : pollOpen ? (
          <span
            className="absolute end-0.5 top-0.5 size-2.5 rounded-full bg-emerald-400"
            aria-hidden
          />
        ) : null}
      </button>

      {pop === "react" && (
        <div className={popCard} role="dialog" aria-label={labels.reactions}>
          <ReactionStrip channel={channel} labels={labels} />
        </div>
      )}
      {pop === "tools" && (
        <ClassToolsCard
          channel={channel}
          labels={labels}
          tools={tools}
          canShareScreen={canShareScreen}
          onMuteAll={onMuteAll}
          onClose={closePop}
        />
      )}
    </div>
  )
}

const TIMER_PRESETS = [1, 3, 5, 10]

/**
 * The host's class tools: reactions, the countdown, the room-wide moderation
 * moves and who may draw. One card, short enough to sit above the row on a
 * phone.
 */
function ClassToolsCard({
  channel,
  labels,
  tools,
  canShareScreen,
  onMuteAll,
  onClose,
}: {
  channel: ClassChannel
  labels: RoomLabels
  tools: RoomTools
  canShareScreen: boolean
  onMuteAll?: () => void
  onClose: () => void
}) {
  const now = useTimerNow(channel.state.timer)
  // A finished countdown offers a fresh one rather than Pause at 0:00.
  const timer = timerDone(channel.state.timer, now) ? null : channel.state.timer
  const left = timer ? timerLeft(timer, now) : 0
  const startTimer = (ms: number, totalMs = ms) =>
    void channel.send({ t: "timer", remainingMs: ms, totalMs, running: true })
  const row =
    "flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-start text-[16px] transition-colors hover:bg-white/10 active:bg-white/15 disabled:opacity-40"

  return (
    <div
      className={cn(popCard, "w-[min(22rem,calc(100vw-1.5rem))]")}
      role="dialog"
      aria-label={labels.classTools}
    >
      <div className="flex justify-center pb-1">
        <ReactionStrip channel={channel} labels={labels} />
      </div>
      <div className="mx-2 h-px bg-white/10" />

      <div className="px-1 pt-2 pb-1">
        <p className="flex items-center gap-2 px-2 pb-1.5 text-[13px] font-medium text-white/60">
          <SfSymbol glyph={timerGlyph} pt={14} />
          {labels.timer}
          {timer && (
            <span className="ms-auto text-[15px] font-semibold text-white tabular-nums">
              {formatClock(left)}
            </span>
          )}
        </p>
        {timer ? (
          <div className="flex gap-2 px-1">
            <button
              type="button"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 text-[15px] font-semibold"
              onClick={() =>
                void channel.send({
                  t: "timer",
                  remainingMs: left,
                  totalMs: timer.totalMs,
                  running: !timer.running,
                })
              }
            >
              <SfSymbol glyph={timer.running ? pauseFill : playFill} pt={16} />
              {timer.running ? labels.timerPause : labels.timerResume}
            </button>
            <button
              type="button"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 text-[15px] font-semibold"
              onClick={() => void channel.send({ t: "timer.stop" })}
            >
              <SfSymbol glyph={stopFill} pt={16} />
              {labels.timerStop}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 px-1">
            {TIMER_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                className="h-11 rounded-full bg-white/15 text-[15px] font-semibold tabular-nums hover:bg-white/25"
                onClick={() => {
                  startTimer(m * 60_000)
                  onClose()
                }}
              >
                {labels.timerMinutes.replace("{n}", String(m))}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mx-2 mt-1 h-px bg-white/10" />

      <div className="pt-1">
        <button
          type="button"
          className={row}
          onClick={() => {
            onMuteAll?.()
            onClose()
          }}
        >
          <SfSymbol glyph={micSlash} pt={18} className="w-6" />
          {labels.muteAll}
        </button>
        <button
          type="button"
          className={row}
          disabled={channel.hands.length === 0}
          onClick={() => {
            void channel.clearAllHands()
            onClose()
          }}
        >
          <SfSymbol glyph={handRaisedSlashFill} pt={18} className="w-6" />
          {labels.lowerAllHands}
          {channel.hands.length > 0 && (
            <span className="ms-auto text-white/60 tabular-nums">
              {channel.hands.length}
            </span>
          )}
        </button>
        {tools.whiteboard && (
          <div className="flex items-center gap-3 px-3 py-1.5">
            <SfSymbol
              glyph={person2BadgeGearshapeFill}
              pt={18}
              className="w-6"
            />
            <span className="min-w-0 flex-1 truncate text-[16px]">
              {labels.boardWho}
            </span>
            <div className="flex rounded-full bg-white/10 p-0.5 text-[13px] font-semibold">
              {(
                [
                  [null, labels.boardOnlyHosts],
                  ["*", labels.boardEveryone],
                ] as Array<[string | null, string]>
              ).map(([to, text]) => (
                <button
                  key={String(to)}
                  type="button"
                  className={cn(
                    "min-h-9 rounded-full px-2.5",
                    (channel.state.grant === "*" ? "*" : null) === to
                      ? "bg-white text-black"
                      : "text-white/80"
                  )}
                  aria-pressed={
                    (channel.state.grant === "*" ? "*" : null) === to
                  }
                  onClick={() => void channel.setGrant(to)}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
        {!canShareScreen && (
          <p className="flex items-center gap-3 px-3 py-2 text-[13px] text-white/50">
            <SfSymbol
              glyph={rectangleInsetFilledAndPersonFilled}
              pt={16}
              className="w-6"
            />
            {labels.shareNeedsComputer}
          </p>
        )}
      </div>
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
      <SfSymbol glyph={enabled ? micFill : micSlashFill} pt={GLYPH_PT} />
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
      <SfSymbol glyph={enabled ? videoFill : videoSlashFill} pt={GLYPH_PT} />
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
      <SfSymbol glyph={rectangleInsetFilledAndPersonFilled} pt={GLYPH_PT} />
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
