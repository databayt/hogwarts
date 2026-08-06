// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// "Why Databayt" band — mirrors the products carousel in ~/marketing:
// an embla rail that peeks past the screen edges, three token-styled
// cards per view, and apple-style paddle nav aligned to the container end.

/* eslint-disable @next/next/no-img-element */

"use client"

import * as React from "react"
import Link from "next/link"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

import { WHY_CARDS, WHY_HEADING, WHY_LINK } from "../page-data/showcase/why"
import type { WhyCard } from "../types"

type EmblaApi = UseEmblaCarouselType[1]

interface Props {
  lang: string
}

export function WhyDatabayt({ lang }: Props) {
  const isRTL = lang === "ar"
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    direction: isRTL ? "rtl" : "ltr",
    loop: false,
    containScroll: "trimSnaps",
  })
  const [canPrev, setCanPrev] = React.useState(false)
  const [canNext, setCanNext] = React.useState(false)

  const onSelect = React.useCallback((api: EmblaApi) => {
    if (!api) return
    setCanPrev(api.canScrollPrev())
    setCanNext(api.canScrollNext())
  }, [])

  React.useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on("select", onSelect).on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  // In RTL the visual "previous" arrow points right, "next" points left.
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft
  const NextIcon = isRTL ? ChevronLeft : ChevronRight

  const headingLines = WHY_HEADING.split("\n")

  return (
    // Symmetric logical margins break out of the centered container in both
    // directions — a physical `ml-…` + `w-screen` only escapes to the left and
    // gives /ar horizontal overflow.
    <div className="bg-muted/40 relative mx-[calc(50%-50vw)] overflow-x-clip py-16 md:py-24">
      <section className="container mx-auto">
        {/* Section header */}
        <div className="mx-auto mb-12 flex max-w-full flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] tracking-tight text-balance sm:text-4xl md:text-5xl">
            {headingLines.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h2>
          <Link
            href={`/${lang}${WHY_LINK.href}`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors sm:text-base"
          >
            {WHY_LINK.label}
            <NextIcon className="size-4" strokeWidth={2.25} />
          </Link>
        </div>

        {/* Carousel — `@container` makes 100cqi resolve to the container
            width, so three cards + two gaps match a `grid-cols-3 gap-4`. */}
        <div className="@container">
          <div className="[margin-inline:calc(50%_-_50vw)] overflow-x-clip">
            <div className="mx-auto w-[100cqi] overflow-visible" ref={emblaRef}>
              <div className="flex gap-4">
                {WHY_CARDS.map((card) => (
                  <div
                    key={card.id}
                    className="min-w-0 shrink-0 grow-0 basis-[100cqi] md:basis-[calc((100cqi-2rem)/3)]"
                  >
                    <WhyProductCard card={card} lang={lang} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Apple-style paddle nav, aligned to the end of the container */}
          <div className="mt-8 flex justify-end gap-3">
            <PaddleButton
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              label={isRTL ? "السابق" : "Previous"}
            >
              <PrevIcon className="size-5" strokeWidth={2.25} />
            </PaddleButton>
            <PaddleButton
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              label={isRTL ? "التالي" : "Next"}
            >
              <NextIcon className="size-5" strokeWidth={2.25} />
            </PaddleButton>
          </div>
        </div>
      </section>
    </div>
  )
}

function WhyProductCard({ card, lang }: { card: WhyCard; lang: string }) {
  return (
    <Link
      href={`/${lang}${card.href}`}
      className="group bg-card text-card-foreground relative flex min-h-[440px] flex-col overflow-hidden rounded-3xl text-start"
    >
      {/* label / title / description — the title holds one line, the body two */}
      <div className="p-8 md:p-10">
        <p className="text-foreground/80 mb-1 text-sm font-medium tracking-tight">
          {card.topic}
        </p>
        <h3 className="font-heading line-clamp-1 text-xl leading-[1.2] font-semibold tracking-tight">
          {card.headline}
        </h3>
        <p className="text-foreground/70 mt-2 line-clamp-2 text-[15px] leading-snug">
          {card.body}
        </p>
      </div>

      {/* art — the bare line illustration, no tinted plate behind it.
          `dark:invert` keeps the dark strokes legible on a dark card, the same
          treatment the feature glyphs get elsewhere in this block. */}
      <div className="pointer-events-none flex flex-1 items-center justify-center px-8 pb-8 md:px-10 md:pb-10">
        <img
          src={card.image}
          alt=""
          loading="lazy"
          aria-hidden="true"
          className="max-h-[180px] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.04] dark:invert"
        />
      </div>
    </Link>
  )
}

function PaddleButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "bg-muted text-foreground/70 flex size-9 items-center justify-center rounded-full",
        "hover:bg-muted-foreground/20 hover:text-foreground transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-40"
      )}
    >
      {children}
    </button>
  )
}
