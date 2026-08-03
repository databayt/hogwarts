// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/atom/animated-button"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface HeroProps {
  lang?: Locale
  subdomain?: string
  dictionary?: Dictionary
  heroImageUrl?: string | null
  schoolName?: string
}

/**
 * Full-bleed opening tile: the school's own photograph, its name, and the two
 * things a visiting parent actually wants to do -- book a visit, or start an
 * application.
 *
 * A school that hasn't uploaded a hero image gets a typographic panel rather
 * than stock photography of someone else's campus -- this renders for every
 * tenant, so the fallback has to be honest about having no photograph.
 */
export function Hero({
  lang = "en",
  dictionary,
  heroImageUrl,
  schoolName,
}: HeroProps) {
  const t = dictionary?.marketing?.site?.hero
  const titleLines = (t?.title ?? "").split("\n").filter(Boolean)

  return (
    <section
      className={cn(
        "bleed-page capsule-b relative isolate flex min-h-[85vh] flex-col justify-end overflow-hidden",
        !heroImageUrl && "band-ink"
      )}
    >
      {heroImageUrl && (
        <>
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url('${heroImageUrl}')` }}
          />
          {/* Scrim: heavier at the bottom, where the type sits. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        </>
      )}

      <div className="px-page pb-16 md:pb-24">
        <div className="max-w-3xl">
          {(t?.eyebrow || schoolName) && (
            <p className="eyebrow mb-4 text-white/70">
              {schoolName ? `${schoolName} — ${t?.eyebrow}` : t?.eyebrow}
            </p>
          )}

          <h1 className="display-1 text-white">
            {titleLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="display-intro mt-6 max-w-xl text-white/80">
            {t?.subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href={`/${lang}/tour`}>
              <AnimatedButton size="lg" className="w-full sm:w-auto">
                {t?.scheduleVisit}
              </AnimatedButton>
            </Link>
            <Link href={`/${lang}/admissions`}>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                {t?.learnMore}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
