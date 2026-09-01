// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

import type { LandingSectionProps } from "./types"

interface WelcomeProps extends LandingSectionProps {
  /** Only admins get the settings call to action. */
  canConfigure?: boolean
}

/**
 * Closing band — who this block is for, next to the Meet welcome illustration.
 *
 * The illustration is Google's own Meet artwork, requested explicitly; it is
 * served from `public/` rather than hotlinked off gstatic so the page has no
 * third-party dependency at render time.
 */
export function ConferenceWelcomeSection({
  dictionary,
  lang,
  canConfigure = false,
}: WelcomeProps) {
  const w = dictionary?.landing?.welcome

  return (
    <section className="mb-16">
      <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
        <div className="flex-1">
          <Image
            src="/conference/warm-welcome.png"
            alt={w?.alt ?? ""}
            width={826}
            height={545}
            className="h-auto w-full max-w-lg"
          />
        </div>

        <div className="flex-1 space-y-4 text-start">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {w?.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {w?.description}
          </p>
          {canConfigure ? (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/${lang}/conference/settings`}
            >
              {w?.cta}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
