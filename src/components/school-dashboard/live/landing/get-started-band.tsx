// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { Activity, Link2, PlaySquare, Video } from "lucide-react"

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import { Reveal } from "./reveal"
import type { LandingSectionProps } from "./types"

const ITEMS = [
  { key: "rooms", Icon: Video },
  { key: "links", Icon: Link2 },
  { key: "recordings", Icon: PlaySquare },
  { key: "diagnostics", Icon: Activity },
] as const

const STEPS = ["one", "two", "three"] as const

/**
 * The case for going online, and the three steps to do it — shown ONLY to an
 * admin of a school that is not teaching online yet.
 *
 * This is the whole reason the old page's marketing survives at all. That copy
 * is good, and for an admin who has not switched the feature on it is exactly
 * what they need. The mistake was showing it to everyone, forever: a student
 * was being told to "turn on online teaching" from a settings page they cannot
 * open, on every visit, below a strip of their own live classes.
 *
 * So the page is a tool once the school is online, and this band — a pitch
 * plus a setup guide — only while it is not. Same page, two states.
 *
 * This is also the one band that animates. It is seen once and then never
 * again, which is where motion belongs; the surfaces above it are opened
 * several times a day and paint immediately.
 */
export function LiveGetStartedBand({ dictionary, lang }: LandingSectionProps) {
  const s = dictionary?.landing?.getStarted

  return (
    <Reveal>
      <section className="mb-16">
        <div className="bg-muted/40 rounded-xl border p-8 sm:p-10">
          <div className="max-w-[52ch]">
            <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              {s?.title}
            </h2>
            <p className={cn(typographyVariants.pageDescription, "mt-3")}>
              {s?.description}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ITEMS.map(({ key, Icon }) => (
              <div key={key} className="text-start">
                <Icon
                  className="mb-3 size-6"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h3 className="mb-1.5 text-sm font-semibold">
                  {s?.items?.[key]?.title}
                </h3>
                <p className={typographyVariants.hint}>
                  {s?.items?.[key]?.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className={cn(typographyVariants.cardTitle, "mb-8")}>
            {s?.howTo?.title}
          </h2>

          <ol className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step} className="text-start">
                <span className="border-foreground text-foreground mb-3 flex size-8 items-center justify-center rounded-full border text-xs font-semibold tabular-nums">
                  {index + 1}
                </span>
                <h3 className="mb-1.5 text-sm font-semibold">
                  {s?.howTo?.steps?.[step]?.title}
                </h3>
                <p className={typographyVariants.hint}>
                  {s?.howTo?.steps?.[step]?.description}
                </p>
              </li>
            ))}
          </ol>

          <Link
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-8 rounded-full"
            )}
            href={`/${lang}/live/settings`}
          >
            {s?.cta}
          </Link>
        </div>
      </section>
    </Reveal>
  )
}
