// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

import { BUS_ART } from "./art"
import type { LandingSectionProps } from "./types"

interface Props extends LandingSectionProps {
  primaryHref: string | null
  secondaryHref: string | null
}

export function CtaSection({ dictionary, primaryHref, secondaryHref }: Props) {
  const t = dictionary?.landing?.cta

  return (
    <section>
      <div className="flex flex-col items-start gap-8 md:flex-row">
        {/* Same literal-light tile as the hero — see hero-section.tsx. */}
        <div
          className="relative flex min-h-[140px] min-w-[140px] items-center justify-center rounded-xl p-4 sm:min-h-[180px] sm:min-w-[180px] md:min-h-[200px] md:min-w-[200px]"
          style={{ backgroundColor: "#F7D774" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BUS_ART}
            alt=""
            width={160}
            height={160}
            className="h-28 w-28 object-contain sm:h-36 sm:w-36 rtl:[transform:scaleX(-1)]"
          />
        </div>

        <div className="space-y-3 text-start">
          <h2 className="text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
            {t?.title || "Ready when the first bell is"}
          </h2>
          <p className="text-muted-foreground max-w-md text-lg">
            {t?.description ||
              "Set the fleet up once and every morning after that runs itself."}
          </p>
          <div className="mt-3 flex gap-4">
            {primaryHref ? (
              <Link
                href={primaryHref}
                className={buttonVariants({ size: "lg" })}
              >
                {t?.primaryCta || "Get started"}
              </Link>
            ) : null}
            {secondaryHref ? (
              <Link
                href={secondaryHref}
                className={buttonVariants({ size: "lg", variant: "ghost" })}
              >
                {t?.secondaryCta || "Transportation settings"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
