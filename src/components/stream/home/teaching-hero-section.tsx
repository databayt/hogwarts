"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { StreamContentProps } from "../types"

export function TeachingHeroSection({ dictionary, lang }: Omit<StreamContentProps, 'schoolId'>) {
  const isRTL = lang === "ar"

  return (
    <section className="py-16 md:py-24 mb-16 bg-[#FAF9F5] rounded-xl">
      <div className="px-8 md:px-12">
        <div className={cn(
          "flex flex-col md:flex-row items-start gap-8",
          isRTL && "md:flex-row-reverse"
        )}>
          {/* Hero Image */}
          <div className="relative flex items-center justify-center rounded-xl p-4 min-w-[180px] min-h-[180px] md:min-w-[200px] md:min-h-[200px] bg-pink-500" style={{ backgroundColor: "#D25F87" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d229061abf091318fc81_6905c83d0735e1bc430025fdd1748d1406079036-1000x1000.svg"
              alt="Teaching illustration"
              width={160}
              height={160}
            />
          </div>

          {/* Text Content */}
          <div className={cn(
            "space-y-3",
            isRTL ? "text-right" : "text-left"
          )}>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              {dictionary?.teachingHero?.title || "Come teach with us"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              {dictionary?.teachingHero?.description ||
                "Become an instructor and change lives — including your own"}
            </p>
            <div className={cn("flex gap-4 mt-3", isRTL && "flex-row-reverse")}>
              <Link
                href={`/${lang}/stream/teach`}
                className={buttonVariants({ size: "lg" })}
              >
                {dictionary?.teachingHero?.cta || "Get started"}
              </Link>
              <Link
                href={`/${lang}/stream/courses`}
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
