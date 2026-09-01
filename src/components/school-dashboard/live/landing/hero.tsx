// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: prop composition only, so none of it reaches the client.
import Image from "next/image"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

import type { LandingSectionProps } from "./types"

interface HeroProps extends LandingSectionProps {
  /** Only staff get the "schedule a class" secondary action. */
  canSchedule?: boolean
}

/**
 * Landing hero — copy on one side, hero image on the other.
 */
export function ConferenceHero({
  dictionary,
  lang,
  canSchedule = false,
}: HeroProps) {
  const d = dictionary?.landing

  return (
    <section className="relative pb-10">
      <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
        {/* Copy */}
        <div className="flex flex-1 flex-col items-start space-y-6 text-start">
          <h1 className="text-4xl leading-none font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            {dictionary?.title}
          </h1>

          <p className="text-muted-foreground max-w-prose text-base leading-relaxed sm:text-lg">
            {d?.description}
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              className={buttonVariants({ size: "lg" })}
              href={`/${lang}/live/dashboard`}
            >
              {d?.viewSessions}
            </Link>

            {canSchedule ? (
              <Link
                className={buttonVariants({ size: "lg", variant: "ghost" })}
                href={`/${lang}/live/schedule`}
              >
                {d?.scheduleClass}
              </Link>
            ) : null}
          </div>
        </div>

        {/* Hero image */}
        <div className="flex flex-1 justify-center">
          <div className="relative w-full max-w-md">
            <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl border shadow-sm">
              <Image
                src="/live/student-online-class.png"
                alt={d?.heroAlt ?? ""}
                fill
                sizes="(max-width: 1024px) 90vw, 28rem"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
