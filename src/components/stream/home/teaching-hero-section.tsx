// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"

import { asset } from "@/lib/asset-url"
import { buttonVariants } from "@/components/ui/button"

import type { StreamContentProps } from "../types"

// CTA points at /stream/teach — the real block flow (propose/upload → review →
// live). The headline/subhead are the pre-2026-07-19 wording, restored on
// request 2026-08-11; note it is Udemy-derived marketing copy, so replace it
// before this page is shown to a real tenant.
//
// The illustration is the same one this section originally showed, but served
// from our own CDN instead of hotlinked off Webflow — see
// scripts/upload-anthropic-assets.ts (`illustrations/hand-shape-build.svg`).
// Absolute URLs pass through asset() untouched, which is how the rest of the
// fine-grouped anthropic/ namespace is referenced.
const ILLUSTRATION = asset(
  "https://cdn.databayt.org/anthropic/illustrations/hand-shape-build.svg"
)
export function TeachingHeroSection({
  dictionary,
  lang,
}: Omit<StreamContentProps, "schoolId">) {
  return (
    <section className="mb-16 py-16 sm:py-20 md:py-24">
      <div>
        <div className="flex flex-col items-start gap-8 md:flex-row">
          {/* Illustration tile */}
          <div
            className="relative flex min-h-[140px] min-w-[140px] items-center justify-center rounded-xl p-4 sm:min-h-[180px] sm:min-w-[180px] md:min-h-[200px] md:min-w-[200px]"
            style={{ backgroundColor: "#D25F87" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ILLUSTRATION}
              alt=""
              width={160}
              height={160}
              className="h-32 w-32 sm:h-40 sm:w-40 rtl:[transform:scaleX(-1)]"
            />
          </div>

          {/* Text Content */}
          <div className="space-y-3 text-start">
            <h2 className="text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
              {dictionary?.teachingHero?.title || "Come teach with us"}
            </h2>
            <p className="text-muted-foreground max-w-md text-lg">
              {dictionary?.teachingHero?.description ||
                "Become an instructor and change lives — including your own"}
            </p>
            <div className="mt-3 flex gap-4">
              <Link
                href={`/${lang}/lumos/teach`}
                className={buttonVariants({ size: "lg" })}
              >
                {dictionary?.teachingHero?.cta || "Get started"}
              </Link>
              <Link
                href={`/${lang}/lumos/courses`}
                className={buttonVariants({ size: "lg", variant: "ghost" })}
              >
                {dictionary?.teachingHero?.learnMore || "Learn more"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
