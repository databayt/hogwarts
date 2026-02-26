// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/atom/animated-button"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface HeroProps {
  lang?: Locale
  subdomain?: string
  dictionary?: Dictionary
}

export function Hero({ lang = "en", subdomain, dictionary }: HeroProps) {
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
            backgroundImage: "url('/site/harry-potter.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 lg:bg-gradient-to-r lg:from-black/60 lg:to-black/40" />
        </div>

        {/* Content for mobile */}
        <div className="px-container relative flex h-full flex-col items-start justify-center lg:hidden">
          <div className="max-w-xl">
            <div className="mb-6 flex items-center gap-2">
              <Image
                src="/site/ball.png"
                alt={t?.logoAlt || "Hogwarts Logo"}
                width={100}
                height={100}
                className="h-14 w-14 dark:invert"
              />
            </div>
            <h1 className="font-heading py-4 text-4xl font-black tracking-tighter text-white sm:text-5xl">
              {titleParts[0]}
              <br />
              {titleParts[1]}
            </h1>
            <p className="max-w-[80%] pb-6 text-white/80">
              {t?.subtitle ||
                "The most magical part of the Harry Potter books, is that they eventually used the skills they learned at school"}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={
                  subdomain ? `/${lang}/s/${subdomain}/tour` : `/${lang}/tour`
                }
              >
                <AnimatedButton
                  size="lg"
                  className="w-full max-w-[200px] sm:w-auto sm:max-w-none"
                >
                  {t?.scheduleVisit || "Schedule a Visit"}
                </AnimatedButton>
              </Link>
              <Link
                href={
                  subdomain
                    ? `/${lang}/s/${subdomain}/admissions`
                    : `/${lang}/admissions`
                }
              >
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
          <div className="flex items-center gap-2">
            <Image
              src="/site/ball.png"
              alt={t?.logoAlt || "Hogwarts Logo"}
              width={100}
              height={100}
              className="h-14 w-14 dark:invert"
            />
          </div>
          <h1 className="font-heading py-4 text-5xl font-black tracking-tighter lg:text-6xl xl:text-7xl">
            {titleParts[0]}
            <br />
            {titleParts[1]}
          </h1>
          <p className="text-muted-foreground max-w-[80%] pb-6">
            {t?.subtitle ||
              "The most magical part of the Harry Potter books, is that they eventually used the skills they learned at school"}
          </p>
          <div className="flex flex-row gap-4">
            <Link
              href={
                subdomain ? `/${lang}/s/${subdomain}/tour` : `/${lang}/tour`
              }
            >
              <AnimatedButton size="lg">
                {t?.scheduleVisit || "Schedule a Visit"}
              </AnimatedButton>
            </Link>
            <Link
              href={
                subdomain
                  ? `/${lang}/s/${subdomain}/admissions`
                  : `/${lang}/admissions`
              }
            >
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
