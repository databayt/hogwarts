// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: prop composition only, so none of it reaches the client.
import Image from "next/image"
import Link from "next/link"
import { Mic, MonitorUp, Video } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

import type { LandingSectionProps } from "./types"

interface HeroProps extends LandingSectionProps {
  /** Only staff get the "schedule a class" secondary action. */
  canSchedule?: boolean
}

/**
 * Landing hero — copy on one side, a room collage on the other.
 *
 * The collage is deliberately a *still* of the product rather than a stock
 * illustration: the speaker tile is a student in a real class, with two
 * smaller tiles and a control bar stacked around it the way the room actually
 * lays out. It mirrors the Figma conferencing design without importing that
 * file's brand purple — every surface here is a semantic token, so the collage
 * reads correctly in both themes.
 *
 * All positioning uses logical properties (start/end), so the collage flips
 * with the rest of the page on /ar.
 */
export function ConferenceHero({
  dictionary,
  lang,
  canSchedule = false,
}: HeroProps) {
  const d = dictionary?.landing

  return (
    // The collage's tiles and control bar hang past the photo's bottom edge,
    // so the section reserves room for them — without the padding they collide
    // with the feature cards below.
    <section className="relative pb-10">
      <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
        {/* Copy */}
        <div className="flex flex-1 flex-col items-start space-y-6 text-start">
          <h1 className="text-4xl leading-none font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            {dictionary?.title}
            <br />
            <span className="mt-2 block text-2xl font-semibold sm:text-3xl md:text-4xl lg:text-5xl">
              {d?.tagline}
            </span>
          </h1>

          <p className="text-muted-foreground max-w-prose text-base leading-relaxed sm:text-lg">
            {d?.description}
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              className={buttonVariants({ size: "lg" })}
              href={`/${lang}/conference/dashboard`}
            >
              {d?.viewSessions}
            </Link>

            {canSchedule ? (
              <Link
                className={buttonVariants({ size: "lg", variant: "ghost" })}
                href={`/${lang}/conference/schedule`}
              >
                {d?.scheduleClass}
              </Link>
            ) : null}
          </div>
        </div>

        {/* Room collage */}
        <div className="flex flex-1 justify-center">
          <div className="relative w-full max-w-md">
            {/* Speaker tile */}
            <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl border shadow-sm">
              <Image
                src="/conference/student-online-class.png"
                alt={d?.heroAlt ?? ""}
                fill
                sizes="(max-width: 1024px) 90vw, 28rem"
                className="object-cover"
                priority
              />
            </div>

            {/* Participant strip — tucked over the speaker tile's end edge */}
            <div className="absolute end-0 -bottom-6 flex gap-2 sm:-end-6">
              {[
                { src: "/conference/tile-participant.png", key: "participant" },
                { src: "/conference/tile-screenshare.png", key: "screenshare" },
              ].map((tile) => (
                <div
                  key={tile.key}
                  className="bg-background relative h-16 w-24 overflow-hidden rounded-xl border shadow-sm sm:h-20 sm:w-32"
                >
                  <Image
                    src={tile.src}
                    alt=""
                    fill
                    sizes="8rem"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Control bar — the room's own chrome, not a decoration */}
            <div
              className="bg-background absolute start-4 -bottom-5 flex items-center gap-3 rounded-full border px-4 py-2 shadow-sm"
              aria-hidden="true"
            >
              <Mic className="size-4" strokeWidth={1.5} />
              <Video className="size-4" strokeWidth={1.5} />
              <MonitorUp className="size-4" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
