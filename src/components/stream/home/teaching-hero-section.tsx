"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { StreamContentProps } from "../types"

export function TeachingHeroSection({ dictionary, lang }: Omit<StreamContentProps, 'schoolId'>) {
  const isRTL = lang === "ar"

  return (
    <section className="py-16 md:py-24 mb-16 bg-[#FAF9F5] rounded-xl">
      <div className="px-8 md:px-12">
        <div className={cn(
          "flex flex-col md:flex-row items-center gap-12",
          isRTL && "md:flex-row-reverse"
        )}>
          {/* Text Content */}
          <div className={cn(
            "md:w-1/2 space-y-6",
            isRTL ? "text-right" : "text-left"
          )}>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              {dictionary?.teachingHero?.title || "Come teach with us"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              {dictionary?.teachingHero?.description ||
                "Become an instructor and change lives — including your own"}
            </p>
            <Link
              href={`/${lang}/stream/teach`}
              className="inline-flex items-center justify-center px-8 py-3 bg-foreground text-background font-semibold rounded-md hover:bg-foreground/90 transition-colors"
            >
              {dictionary?.teachingHero?.cta || "Get started"}
            </Link>
          </div>

          {/* Hero Image */}
          <div className="md:w-1/2 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d229061abf091318fc81_6905c83d0735e1bc430025fdd1748d1406079036-1000x1000.svg"
              alt="Teaching illustration"
              className="w-full max-w-md"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
