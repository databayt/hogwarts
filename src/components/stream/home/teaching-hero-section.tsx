"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import type { StreamContentProps } from "../types"

export function TeachingHeroSection({
  dictionary,
  lang,
}: Omit<StreamContentProps, "schoolId">) {
  const isRTL = lang === "ar"

  return (
    <section className="mb-16 py-16 md:py-24">
      <div>
        <div
          className={cn(
            "flex flex-col items-start gap-8 md:flex-row",
            isRTL && "md:flex-row-reverse"
          )}
        >
          {/* Hero Image */}
          <div
            className="relative flex min-h-[180px] min-w-[180px] items-center justify-center rounded-xl bg-pink-500 p-4 md:min-h-[200px] md:min-w-[200px]"
            style={{ backgroundColor: "#D25F87" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d229061abf091318fc81_6905c83d0735e1bc430025fdd1748d1406079036-1000x1000.svg"
              alt="Teaching illustration"
              width={160}
              height={160}
            />
          </div>

          {/* Text Content */}
          <div className="space-y-3 text-start">
            <h2 className="text-4xl leading-tight font-bold md:text-5xl">
              {dictionary?.teachingHero?.title || "Come teach with us"}
            </h2>
            <p className="text-muted-foreground max-w-md text-lg">
              {dictionary?.teachingHero?.description ||
                "Become an instructor and change lives — including your own"}
            </p>
            <div className={cn("mt-3 flex gap-4", isRTL && "flex-row-reverse")}>
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
