// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

import { BUS_ART } from "./art"
import type { LandingSectionProps } from "./types"

interface Props extends LandingSectionProps {
  /** Resolved in content.tsx against the viewer's role; null hides the button. */
  primaryHref: string | null
  secondaryHref: string | null
}

export function HeroSection({ dictionary, primaryHref, secondaryHref }: Props) {
  const t = dictionary?.landing?.hero

  return (
    <section className="relative">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
        <div className="flex flex-1 flex-col items-start space-y-6 text-start">
          <h1 className="text-4xl leading-none font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            {dictionary?.title || "Transportation"}
            <br />
            <span className="mt-2 block text-2xl font-semibold sm:text-3xl md:text-4xl lg:text-5xl">
              {t?.tagline || "Every ride accounted for."}
            </span>
          </h1>

          <p className="text-muted-foreground max-w-xl text-lg">
            {t?.description ||
              "Fleet, routes, drivers and daily runs in one place — with live tracking and a boarding record for every student."}
          </p>

          {primaryHref ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                className={buttonVariants({ size: "lg" })}
                href={primaryHref}
              >
                {t?.primaryCta || "Open the dashboard"}
              </Link>
              {secondaryHref ? (
                <Link
                  className={buttonVariants({ size: "lg", variant: "ghost" })}
                  href={secondaryHref}
                >
                  {t?.secondaryCta || "See today's trips"}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {/*
          The bus art is the same line drawing the tenant marketing homepage
          uses in its features section, hotlinked from the same Webflow bucket
          (see school-marketing/zenda-home/phone-mockup.tsx). It is drawn in
          near-black on white, so the tile behind it is a literal light amber
          rather than a theme surface — bg-muted would swallow it in dark mode,
          the same pairing lumos/home/how-to-begin-section.tsx documents.
        */}
        <div className="flex flex-1 justify-center">
          <div
            className="flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-xl p-8"
            style={{ backgroundColor: "#F7D774" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BUS_ART}
              alt=""
              width={512}
              height={400}
              className="max-h-full max-w-full object-contain rtl:[transform:scaleX(-1)]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
