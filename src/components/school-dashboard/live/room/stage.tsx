"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createContext, useContext } from "react"
import {
  CarouselLayout,
  FocusLayout,
  GridLayout,
  isTrackReference,
  ParticipantTile,
  useLocalParticipant,
  useMaybeTrackRefContext,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react"
import { Track } from "livekit-client"

import { cn } from "@/lib/utils"
import {
  handRaisedFill,
  SfSymbol,
} from "@/components/lumos/shared/video-player/sf-symbols"

import { Board } from "./board/board"
import type { RoomLabels } from "./labels"
import { SlidesView } from "./slides"
import type { ClassChannel } from "./use-class-channel"

/** Raised hands in order, read by every tile without threading props
 *  through LiveKit's layouts. */
const HandsContext = createContext<string[]>([])

/**
 * A LiveKit tile with the class's marks over it — a raised hand and its
 * place in line. Wraps the stock tile rather than restyling it.
 */
function ClassTile({ trackRef }: { trackRef?: TrackReferenceOrPlaceholder }) {
  const fromLoop = useMaybeTrackRefContext()
  const ref = trackRef ?? fromLoop
  const hands = useContext(HandsContext)
  const place = ref ? hands.indexOf(ref.participant.identity) : -1
  return (
    <div className="relative h-full w-full">
      <ParticipantTile trackRef={ref} className="h-full w-full" />
      {place >= 0 && (
        <span
          className="pointer-events-none absolute end-2 top-2 flex h-8 items-center gap-1 rounded-full bg-amber-400 ps-2 pe-2.5 text-sm font-bold text-black shadow-lg motion-safe:animate-[bounce_1s_ease-in-out_2]"
          aria-hidden
        >
          <SfSymbol glyph={handRaisedFill} pt={16} />
          {place + 1}
        </span>
      )}
    </div>
  )
}

interface StageProps {
  channel: ClassChannel
  labels: RoomLabels
}

/**
 * What fills the screen: the whiteboard or the slides when the host has one
 * up, else a screen share, else the camera grid. Cameras ride in a side
 * strip whenever something else has focus, so the teacher never disappears
 * behind their own slides.
 */
export function Stage({ channel, labels }: StageProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )
  const { localParticipant } = useLocalParticipant()
  const share = tracks.find(
    (t) => t.source === Track.Source.ScreenShare && isTrackReference(t)
  )
  // Observers (watching guardians) hold a subscribe-only grant and can never
  // publish, so their camera slot is a permanent empty placeholder — 25
  // parents watching drew 25 blank tiles over the class. They stay in the
  // people list; the stage is for people who can be seen. A real track is
  // always kept, whatever the grant says.
  const allCameras = tracks.filter(
    (t) =>
      t.source === Track.Source.Camera &&
      (isTrackReference(t) || t.participant.permissions?.canPublish !== false)
  )
  const { whiteboard, slides, spotlight } = channel.state
  // The spotlit student leads the strip; the teacher comes next.
  const spot = spotlight
    ? allCameras.find((t) => t.participant.identity === spotlight)
    : undefined
  const cameras = [...allCameras].sort((a, b) => rank(a) - rank(b))
  function rank(t: TrackReferenceOrPlaceholder) {
    if (t.participant.identity === spotlight) return 0
    if (t.participant.identity === channel.hostIdentity) return 1
    return 2
  }
  // The one picture a phone keeps while the board or slides fill it.
  const pip = spot ?? cameras.find((t) => !t.participant.isLocal) ?? cameras[0]

  const focus = whiteboard ? (
    <Board channel={channel} labels={labels} />
  ) : slides ? (
    <SlidesView
      slides={slides}
      canControl={channel.isHost}
      onPage={(page) =>
        void channel.send({
          t: "slides",
          slides: { ...slides, page: Math.max(1, page) },
        })
      }
      onStop={() => void channel.send({ t: "slides", slides: null })}
      labels={labels}
    />
  ) : share && isTrackReference(share) ? (
    <FocusLayout trackRef={share} className="h-full w-full" />
  ) : spot ? (
    // "Give the floor": the student fills the stage for everyone.
    <ClassTile trackRef={spot} />
  ) : null

  if (!focus) {
    // Nobody else here and the reader's own camera off: say so, rather than
    // drawing the SDK's grey silhouette across the whole stage (Abdout,
    // 2026-09-13). A camera that is on still shows the reader to themselves.
    if (
      cameras.length === 0 ||
      (cameras.length === 1 &&
        cameras[0].participant.isLocal &&
        !localParticipant.isCameraEnabled)
    ) {
      return (
        <div className="flex h-full w-full items-center justify-center px-6">
          <p className="text-center text-lg font-medium text-white/70">
            {labels.aloneInRoom}
          </p>
        </div>
      )
    }

    // One camera is the frame's picture, not a grid: it runs edge to edge
    // with no tile radius, gap, name badge or per-tile focus toggle (the
    // reader knows who they are, and the top pill already holds
    // fit/fullscreen). Two or more keep the grid's own chrome.
    const lone = cameras.length === 1
    return (
      <div
        className={cn(
          "h-full w-full",
          lone &&
            // `!` because LiveKit's stylesheet is unlayered and outranks a
            // Tailwind utility layer at any specificity.
            "[&_.lk-focus-toggle-button]:hidden! [&_.lk-grid-layout]:gap-0! [&_.lk-grid-layout]:p-0! [&_.lk-participant-metadata]:hidden! [&_.lk-participant-tile]:rounded-none!"
        )}
        data-lone-camera={lone ? "" : undefined}
      >
        <HandsContext.Provider value={channel.hands}>
          <GridLayout tracks={cameras} className="h-full w-full">
            <ClassTile />
          </GridLayout>
        </HandsContext.Provider>
      </div>
    )
  }

  // The board runs edge to edge (it fits its own page and keeps clear of
  // the chrome); slides, a share and a spotlight keep the stage's gutter.
  return (
    <HandsContext.Provider value={channel.hands}>
      <div
        className={cn(
          "relative flex h-full w-full",
          !whiteboard && "gap-2 p-2"
        )}
      >
        <div className="min-h-0 min-w-0 flex-1">{focus}</div>
        <div
          className={cn(
            "hidden w-44 shrink-0 sm:block",
            whiteboard && "py-16 pe-2"
          )}
        >
          <CarouselLayout
            tracks={
              spot && !whiteboard && !slides && !share
                ? cameras.slice(1)
                : cameras
            }
            orientation="vertical"
            className="h-full"
          >
            <ClassTile />
          </CarouselLayout>
        </div>
        {/* A phone has no room for the strip: the teacher (or the student
            with the floor) floats in the top corner, under the top row and
            clear of the bottom controls, instead of vanishing. */}
        {pip && (whiteboard || slides || share) && (
          <div className="pointer-events-none absolute end-3 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.75rem))] z-10 aspect-[3/4] w-20 overflow-hidden rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.5)] ring-1 ring-white/20 sm:hidden [&_.lk-participant-metadata]:hidden!">
            <ClassTile trackRef={pip} />
          </div>
        )}
      </div>
    </HandsContext.Provider>
  )
}
