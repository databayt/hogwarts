// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { asset } from "@/lib/asset-url"
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
}

export function Hero({
  lang = "en",
  subdomain,
  dictionary,
  heroImageUrl,
}: HeroProps) {
  const isRTL = lang === "ar"

  // Get translations with fallbacks
  const t = dictionary?.marketing?.site?.hero

  // Parse title to handle newlines
  const titleParts = t?.title?.split("\n") || [
    "Beautiful Mind,",
    "Curious. Wonder.",
  ]

  return (
    <section className="grid h-[calc(100vh-3.5rem)] w-full grid-cols-1 lg:grid-cols-2 lg:py-8">
      {/* Image Half */}
      <div className="relative -mx-[var(--marketing-px)] h-full lg:order-last lg:mx-0">
        <div
          className="absolute inset-0 overflow-hidden rounded-none lg:inset-y-8 lg:rounded-sm"
          style={{
            backgroundImage: `url('${heroImageUrl || asset("/photos/harry-potter.png")}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 lg:bg-gradient-to-r lg:from-black/60 lg:to-black/40" />
        </div>

        {/* Content for mobile */}
        <div className="px-container relative flex h-full flex-col items-start justify-center lg:hidden">
          <div className="max-w-xl">
            <h1
              className={cn(
                "font-heading py-4 font-black tracking-tighter text-white",
                isRTL ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
              )}
            >
              {titleParts[0]}
              <br />
              {titleParts[1]}
            </h1>
            <p
              className={cn(
                "max-w-[80%] text-white/80",
                isRTL ? "py-4 pb-8" : "pb-6"
              )}
            >
              {t?.subtitle ||
                "The most magical part of the Harry Potter books, is that they eventually used the skills they learned at school"}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href={`/${lang}/tour`}>
                <AnimatedButton
                  size="lg"
                  className="w-full max-w-[200px] sm:w-auto sm:max-w-none"
                >
                  {t?.scheduleVisit || "Schedule a Visit"}
                </AnimatedButton>
              </Link>
              <Link href={`/${lang}/admissions`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full max-w-[200px] border-white bg-transparent text-white hover:bg-white/10 sm:w-auto sm:max-w-none"
                >
                  {t?.learnMore || "Learn More"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="relative hidden h-full items-center lg:flex">
        <div className="max-w-xl">
          <h1
            className={cn(
              "font-heading py-4 font-black tracking-tighter",
              isRTL
                ? "text-6xl lg:text-7xl xl:text-8xl"
                : "text-5xl lg:text-6xl xl:text-7xl"
            )}
          >
            {titleParts[0]}
            <br />
            {titleParts[1]}
          </h1>
          <p
            className={cn(
              "text-muted-foreground max-w-[80%]",
              isRTL ? "py-4 pb-8" : "pb-6"
            )}
          >
            {t?.subtitle ||
              "The most magical part of the Harry Potter books, is that they eventually used the skills they learned at school"}
          </p>
          <div className="flex flex-row gap-4">
            <Link href={`/${lang}/tour`}>
              <AnimatedButton size="lg">
                {t?.scheduleVisit || "Schedule a Visit"}
              </AnimatedButton>
            </Link>
            <Link href={`/${lang}/admissions`}>
              <Button variant="outline" size="lg">
                {t?.learnMore || "Learn More"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
