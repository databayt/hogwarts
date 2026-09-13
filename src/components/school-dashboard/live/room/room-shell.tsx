"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocalParticipant, useRoomContext } from "@livekit/components-react"
import { Maximize, Minimize, Video, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  glassButton,
  glassPill,
  glassScrim,
  glassSurface,
} from "@/components/lumos/shared/video-player/glass"
import { VideoWatermark } from "@/components/lumos/shared/video-player/video-watermark"
import { recordClassEvent } from "@/components/school-dashboard/live/actions/room-events"
import {
  ParticipantsPanel,
  type ParticipantsPanelLabels,
} from "@/components/school-dashboard/live/participants-panel"
import type {
  ConferenceParticipantRole,
  RoomConfig,
} from "@/components/school-dashboard/live/types"

import type { Poll } from "./class-channel"
import { ClassProgress } from "./class-progress"
import { ControlBar, QualityMenuButton } from "./control-bar"
import type { RoomLabels } from "./labels"
import { AudioOnlyBanner, ReconnectingOverlay } from "./overlays"
import { SidePanel, type PanelTab } from "./side-panel"
import type { SlideOption } from "./slide-options"
import { Stage } from "./stage"
import { useAdaptiveDelivery } from "./use-adaptive-delivery"
import { useAutoHide } from "./use-auto-hide"
import { useClassChannel } from "./use-class-channel"

interface RoomShellProps {
  sessionId: string
  /** The localized subject — the fallback line printed above the clock when
   *  the in-call chrome carries no other name for the class (see below). */
  title: string
  /** The info label's small first line after the live marker — where the
   *  player prints `C1 L1 course`. Null drops it to the marker alone. */
  subtitle?: string | null
  role: ConferenceParticipantRole
  hostIdentity: string | null
  labels: RoomLabels
  participantsLabels: ParticipantsPanelLabels
  slides: SlideOption[]
  config: RoomConfig
  /** The class's own clock, for the card's progress row. Null on an open
   *  room, which has no slated start or end. */
  clock: { startsAtMs: number | null; endsAtMs: number | null }
}

/** A chrome layer's motion in and out, and its absence. */
const layer =
  "absolute inset-x-0 z-20 transition-[opacity,translate] duration-300 motion-reduce:transition-none"
const gone = "pointer-events-none opacity-0"

/**
 * Everything inside the connected room: the stage, and the lumos player's
 * chrome floating over it — `video-player.tsx` as BUILT is the reference
 * (Abdout, 2026-09-13), which supersedes the Figma card this used to be.
 *
 * - Top row: the player's phone row. ✕ as its own 44px glass circle on the
 *   reading edge, a glass pill of 54px slots beside it (people · fit), and a
 *   lone circle pushed to the far end (the connection, in the speaker's slot).
 *   21px in from the sides, under the safe-area inset.
 * - Bottom block: no card. The player's scrim runs the full width, and on it
 *   the two-line info label (● live · subtitle, then the subject in bold),
 *   the one-line `clock · track · clock` row, then the class's row of five —
 *   which stays a row rather than the player's centre transport, because a
 *   class has no transport and the row was chosen over that (2026-09-03).
 *
 * ONE block with `sm:` variants, not the player's two sibling chromes: the
 * row of five runs track toggles and device selects, and the clock owns a
 * one-second ticker — mounting them twice would double both.
 *
 * It behaves like the player's too. It fades three seconds after the last
 * touch and comes back on a tap of the stage, and the stage runs edge to edge
 * UNDER it rather than shrinking to make room — on a phone the teacher's 16:9
 * picture sits in a letterbox, and the card lands on the black band below
 * it. A grid of faces can have its bottom row under the card for the three
 * seconds the card is up, which is the reference's trade too.
 */
export function RoomShell({
  sessionId,
  title,
  subtitle,
  role,
  hostIdentity,
  labels,
  participantsLabels,
  slides,
  config,
  clock,
}: RoomShellProps) {
  const isHost = role === "HOST" || role === "CO_HOST"
  const channel = useClassChannel({ hostIdentity, isHost })
  const adaptive = useAdaptiveDelivery()
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [panel, setPanel] = useState<PanelTab | null>(null)
  // Recording consent: shown once per join, dismissible; the school can
  // replace the sentence.
  const [consentSeen, setConsentSeen] = useState(false)

  // What holds the chrome up: the side panel, any open menu, a control with
  // keyboard focus. Each owner reports its own state; the hook takes the OR.
  const [barPinned, setBarPinned] = useState(false)
  const [qualityPinned, setQualityPinned] = useState(false)
  const [peoplePinned, setPeoplePinned] = useState(false)
  const [focusPinned, setFocusPinned] = useState(false)
  const hide = useAutoHide(
    Boolean(panel) || barPinned || qualityPinned || peoplePinned || focusPinned
  )
  const hidden = !hide.visible
  const onFocusCapture = useCallback(() => setFocusPinned(true), [])
  const onBlurCapture = useCallback((e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocusPinned(false)
    }
  }, [])
  // A press on the chrome must never reach the stage's toggle underneath.
  const swallow = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])

  // The frame's third top glyph is its aspect toggle. Where the browser can
  // put the room on the whole screen that is what it does; where it cannot
  // (an iPhone, which reserves fullscreen for <video> alone) it toggles the
  // picture between filling the stage and fitting inside it — the same glyph
  // meaning the same thing on every device it can.
  const rootRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [fit, setFit] = useState(false)
  const fullscreenSupported =
    typeof document !== "undefined" && Boolean(document.fullscreenEnabled)
  useEffect(() => {
    const on = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", on)
    return () => document.removeEventListener("fullscreenchange", on)
  }, [])
  const onAspect = () => {
    if (fullscreenSupported) {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void rootRef.current?.requestFullscreen?.()
    } else {
      setFit((f) => !f)
    }
  }
  const aspectLabel = fullscreenSupported
    ? fullscreen
      ? labels.exitFullscreen
      : labels.fullscreen
    : fit
      ? labels.fillScreen
      : labels.fitScreen
  const aspectOn = fullscreenSupported ? fullscreen : fit

  // The host's client is the room's memory: closed polls and questions
  // become ConferenceEvent rows. Best-effort — a failed write never
  // interrupts the class.
  const onPollClosed = useCallback(
    (poll: Poll) => {
      void recordClassEvent({
        sessionId,
        kind: "poll_closed",
        key: poll.id,
        payload: {
          question: poll.question,
          options: poll.options,
          counts: poll.counts,
          total: poll.total,
        },
      }).catch(() => {})
    },
    [sessionId]
  )
  const onQuestion = useCallback(
    (id: string, text: string, from: string) => {
      void recordClassEvent({
        sessionId,
        kind: "question",
        key: id,
        payload: { text, from },
      }).catch(() => {})
    },
    [sessionId]
  )

  // Persist each question once as it arrives — here, not in the questions
  // tab, so a host who never opens the tab still leaves a record.
  const seen = useRef(new Set<string>())
  useEffect(() => {
    if (!isHost) return
    for (const q of channel.state.questions) {
      if (seen.current.has(q.id)) continue
      seen.current.add(q.id)
      onQuestion(q.id, q.text, q.name)
    }
  }, [channel.state.questions, isHost, onQuestion])

  return (
    // One black stage, everything else floating on top of it — the lumos
    // player's shape. `fit` letterboxes every tile's video inside its box;
    // the SDK's default is to fill it.
    <div
      ref={rootRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-black text-white",
        fit && "[&_.lk-participant-media-video]:object-contain"
      )}
      // Hover re-arms the chrome the way a mouse over a video does. Gated to
      // a MOUSE: a thumb jitters before it taps, and a touch `pointermove`
      // that revealed the chrome would leave the tap itself with nothing to
      // do but hide it again — a flash, then nothing, on every phone.
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") hide.poke()
      }}
    >
      <ReconnectingOverlay labels={labels} />

      <div className="relative flex h-full min-h-0">
        <main
          className="relative min-w-0 flex-1 select-none"
          onContextMenu={(e) => e.preventDefault()}
          onClick={hide.toggle}
        >
          <div className="absolute inset-0">
            <Stage channel={channel} labels={labels} />
          </div>
          {/* Forensic mark over the whole stage: a recording or screenshot
              of the class carries who was watching. */}
          <VideoWatermark
            userId={localParticipant.identity}
            userEmail={localParticipant.name ?? undefined}
            rotationInterval={20000}
          />

          {/* Top row — the player's phone row (`video-player.tsx`, "Top row:
              close · PiP/share pill · volume"). The ✕ leads on the reading
              edge, which is the right one under RTL; `ms-auto` sends the
              connection to the far end. From `sm` the controls shrink to the
              wide player's scale. */}
          <div
            className={cn(
              layer,
              "top-0 flex items-center gap-3 px-[21px] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 sm:pt-4",
              hidden && cn(gone, "-translate-y-2")
            )}
            onClick={swallow}
            onPointerDown={hide.poke}
            onFocusCapture={onFocusCapture}
            onBlurCapture={onBlurCapture}
          >
            {/* The player's ✕ closes it; ours leaves the class. The SDK's own
                button brings its own styles, so this is the same call on the
                room without them. `CLIENT_INITIATED` on the way out sends the
                reader back to the class page. */}
            <button
              type="button"
              className={cn(
                glassButton,
                "flex size-11 shrink-0 items-center justify-center text-white sm:size-9"
              )}
              style={glassSurface}
              aria-label={labels.leave}
              onClick={() => void room.disconnect()}
            >
              <X className="size-4" strokeWidth={2.5} aria-hidden />
            </button>
            <div
              className={cn(glassPill, "flex h-11 items-center sm:h-9")}
              style={glassSurface}
            >
              <ParticipantsPanel
                variant="glyph"
                sessionId={sessionId}
                canModerate={isHost}
                labels={participantsLabels}
                onOpenChange={setPeoplePinned}
              />
              <button
                type="button"
                className={cn(
                  "flex h-11 w-[54px] items-center justify-center rounded-full text-white transition-opacity active:opacity-60 sm:h-9 sm:w-11",
                  aspectOn && "bg-white/25"
                )}
                aria-pressed={aspectOn}
                aria-label={aspectLabel}
                title={aspectLabel}
                onClick={onAspect}
              >
                {aspectOn ? (
                  <Minimize className="size-5" aria-hidden />
                ) : (
                  <Maximize className="size-5" aria-hidden />
                )}
              </button>
            </div>
            <div className="ms-auto">
              <QualityMenuButton
                adaptive={adaptive}
                labels={labels}
                onPinned={setQualityPinned}
                className={cn(glassButton, "size-11 sm:size-9")}
                style={glassSurface}
              />
            </div>
          </div>

          {/* Status, centred under the top pills — a floating notice rather
              than a full-width strip, so nothing below it shifts when it
              appears. */}
          <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center gap-2 px-3">
            <AudioOnlyBanner on={adaptive.tier === "audio"} labels={labels} />

            {config.recording && !consentSeen && (
              <div
                role="status"
                className={cn(
                  glassPill,
                  "pointer-events-auto flex max-w-lg items-center gap-2 px-3 py-2 text-sm"
                )}
                style={glassSurface}
                onClick={swallow}
              >
                <Video className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">
                  {config.consentNote ?? labels.recordingConsent}
                </span>
                <button
                  type="button"
                  className="rounded-full p-1 transition-colors hover:bg-white/20"
                  aria-label={labels.dismiss}
                  onClick={() => setConsentSeen(true)}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            )}
          </div>

          {/* Bottom block — the player's, phone and wide in one: its scrim
              across the full width (no card), 96px of fade above the text on
              a phone and 64px from `sm`, 21px / 16px side insets, the home
              indicator's inset below. */}
          <div
            className={cn(
              layer,
              "bottom-0",
              glassScrim,
              "px-[21px] pt-24 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-16 sm:pb-4",
              hidden && cn(gone, "translate-y-2")
            )}
            onClick={swallow}
            onPointerDown={hide.poke}
            onFocusCapture={onFocusCapture}
            onBlurCapture={onBlurCapture}
          >
            {/* The player's info label. Its small first line carries the live
                marker (it used to sit between the clocks, where the player has
                no slot) and the subtitle; the second is the subject — 24px bold
                on a phone, 16px semibold wide, as the player sets its title.
                Printed on EVERY room now, timed or open. */}
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-1.5 text-[15px] leading-none text-white/85 sm:text-xs sm:text-white">
                <span
                  className="size-1.5 shrink-0 rounded-full bg-red-500"
                  aria-hidden
                />
                <span className="truncate">
                  {labels.live}
                  {subtitle ? ` · ${subtitle}` : ""}
                </span>
              </p>
              {title && (
                <p className="mt-1 truncate text-2xl leading-none font-bold text-white sm:mt-1 sm:text-base sm:leading-snug sm:font-semibold">
                  {title}
                </p>
              )}
            </div>
            <ClassProgress
              startsAtMs={clock.startsAtMs}
              endsAtMs={clock.endsAtMs}
              labels={labels}
              className="mt-[13px] sm:mt-2"
            />
            {/* The row of five, in the capsule row's place: 13px under the
                clock, spread across a phone, held to a phone's width from
                `sm` so five glyphs do not scatter across a desktop. */}
            <div className="mx-auto mt-[13px] w-full sm:mt-3 sm:max-w-sm">
              <ControlBar
                role={role}
                tools={config.tools}
                labels={labels}
                channel={channel}
                panel={panel}
                onPanel={setPanel}
                slides={slides}
                onPinned={setBarPinned}
              />
            </div>
          </div>
        </main>

        {panel && (
          <div className="absolute inset-y-0 end-0 z-30 sm:static sm:z-auto">
            <SidePanel
              tab={panel}
              onTab={setPanel}
              onClose={() => setPanel(null)}
              channel={channel}
              canAsk={role !== "OBSERVER"}
              tools={config.tools}
              isHost={isHost}
              localIdentity={localParticipant.identity}
              labels={labels}
              onPollClosed={isHost ? onPollClosed : undefined}
              onQuestion={isHost ? onQuestion : undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}
