"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocalParticipant, useRoomContext } from "@livekit/components-react"
import { Maximize, Minimize, Video, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  glassPanel,
  glassPill,
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
import { glyph } from "./glyph"
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
  title: string
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
 * Everything inside the connected room: the stage, and the player's chrome
 * floating over it.
 *
 * The chrome is the lesson player's phone layout — the frame's own three
 * groups. A pill at the top start (leave · people · fit), a pill at the top
 * end (the connection), and one glass card along the bottom holding the
 * class's clock and its row of controls. Nothing else sits on the picture:
 * the class name is what the reader just chose, and a room is not the place
 * to keep reading it.
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

          {/* Top chrome: the frame's two pills. Start side — leave, people,
              fit; end side — the connection. `justify-between` puts the first
              on the reading edge, which is the right one under RTL. */}
          <div
            className={cn(
              layer,
              "top-0 flex items-start justify-between p-3",
              hidden && cn(gone, "-translate-y-2")
            )}
            onClick={swallow}
            onPointerDown={hide.poke}
            onFocusCapture={onFocusCapture}
            onBlurCapture={onBlurCapture}
          >
            <div
              className={cn(glassPill, "flex items-center gap-0.5 p-1")}
              style={glassSurface}
            >
              {/* The frame's ✕ closes the player; ours leaves the class. The
                  SDK's own button brings its own styles, so this is the same
                  call on the room without them. `CLIENT_INITIATED` on the
                  way out sends the reader back to the class page. */}
              <button
                type="button"
                className={glyph}
                aria-label={labels.leave}
                onClick={() => void room.disconnect()}
              >
                <X className="size-5" aria-hidden />
              </button>
              <ParticipantsPanel
                variant="glyph"
                sessionId={sessionId}
                canModerate={isHost}
                labels={participantsLabels}
                onOpenChange={setPeoplePinned}
              />
              <button
                type="button"
                className={cn(glyph, aspectOn && "bg-white/25")}
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
            <div
              className={cn(glassPill, "flex items-center p-1")}
              style={glassSurface}
            >
              <QualityMenuButton
                adaptive={adaptive}
                labels={labels}
                onPinned={setQualityPinned}
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

          {/* The card. Its own glass is its ground — the frame runs no scrim
              under it. Clears the home indicator on a phone. */}
          <div
            className={cn(
              layer,
              "bottom-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
              hidden && cn(gone, "translate-y-2")
            )}
            onClick={swallow}
            onPointerDown={hide.poke}
            onFocusCapture={onFocusCapture}
            onBlurCapture={onBlurCapture}
          >
            <div
              className={cn(
                glassPanel,
                "mx-auto flex w-full max-w-lg flex-col gap-2.5 p-3.5"
              )}
              style={glassSurface}
            >
              <ClassProgress
                startsAtMs={clock.startsAtMs}
                endsAtMs={clock.endsAtMs}
                labels={labels}
              />
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
