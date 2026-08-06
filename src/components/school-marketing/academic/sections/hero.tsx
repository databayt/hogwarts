// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { AcademicHeroIllustration } from "./hero-illustration"

interface AcademicHeroProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicHero({ lang, dictionary }: AcademicHeroProps) {
  // Get translations with fallbacks
  const t = dictionary?.marketing?.site?.academic?.hero

  // Parse title to handle newlines
  const titleParts = t?.title?.split("\n") || ["Academic", "Excellence"]

  // 5.5rem ~= the zenda nav's rendered height (84.5px). Colors are pinned to
  // the light scheme -- the page lives on the zenda cream, which never flips.
  return (
    <section id="hero" className="min-h-[calc(100svh-5.5rem)]">
      <div className="grid min-h-[calc(100svh-5.5rem)] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Left: Content */}
        <div className="space-y-6 py-12 lg:py-0">
          <h1 className="font-heading text-5xl font-black tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl xl:text-8xl">
            <span className="block">{titleParts[0]}</span>
            <span className="block">{titleParts[1]}</span>
          </h1>

          <p className="band-muted max-w-md text-lg">
            {t?.subtitle ||
              "Discover your potential through rigorous academics and innovative learning. Our comprehensive programs are designed to unlock every student's capabilities."}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${lang}/application`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "band-charcoal w-full hover:bg-neutral-700 sm:w-auto"
              )}
            >
              {t?.explorePrograms || "Explore Programs"}
            </Link>
            <Link
              href={`/${lang}/admissions`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "group w-full border-neutral-900/15 bg-transparent text-neutral-900 hover:bg-white hover:text-neutral-900 sm:w-auto"
              )}
            >
              {t?.viewCurriculum || "View Curriculum"}
              <AnthropicIcons.ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right: Illustration - hidden on mobile/tablet for performance */}
        <div className="hidden items-center justify-center lg:flex lg:justify-end">
          <AcademicHeroIllustration />
        </div>
      </div>
    </section>
  )
}
