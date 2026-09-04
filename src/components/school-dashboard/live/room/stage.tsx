"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  CarouselLayout,
  FocusLayout,
  GridLayout,
  isTrackReference,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react"
import { Track } from "livekit-client"

import { cn } from "@/lib/utils"

import type { RoomLabels } from "./labels"
import { SlidesView } from "./slides"
import type { ClassChannel } from "./use-class-channel"
import { Whiteboard } from "./whiteboard"

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
  const share = tracks.find(
    (t) => t.source === Track.Source.ScreenShare && isTrackReference(t)
  )
  const cameras = tracks.filter((t) => t.source === Track.Source.Camera)
  const { whiteboard, slides } = channel.state

  const focus = whiteboard ? (
    <Whiteboard
      strokes={channel.state.strokes}
      canDraw={channel.isHost}
      onStroke={(s) => void channel.sendStroke(s)}
      onClear={() => void channel.send({ t: "wb.clear" })}
      labels={labels}
    />
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
  ) : null

  if (!focus) {
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
        <GridLayout tracks={cameras} className="h-full w-full">
          <ParticipantTile />
        </GridLayout>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full gap-2 p-2">
      <div className="min-h-0 min-w-0 flex-1">{focus}</div>
      <div className="hidden w-44 shrink-0 sm:block">
        <CarouselLayout
          tracks={cameras}
          orientation="vertical"
          className="h-full"
        >
          <ParticipantTile />
        </CarouselLayout>
      </div>
    </div>
  )
}
