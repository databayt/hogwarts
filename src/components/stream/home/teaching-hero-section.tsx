// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

import type { StreamContentProps } from "../types"

// Honest school framing: teachers contribute lessons to their own students
// (real block flow: propose/upload → review → live). CTA points at /stream/teach.
// Icon is lucide — the previous external website-files.com hotlink is gone.
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
            <GraduationCap
              className="h-20 w-20 text-white sm:h-24 sm:w-24"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>

          {/* Text Content */}
          <div className="space-y-3 text-start">
            <h2 className="text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
              {dictionary?.teachingHero?.title ||
                "Share your lessons with your students"}
            </h2>
            <p className="text-muted-foreground max-w-md text-lg">
              {dictionary?.teachingHero?.description ||
                "Record a lesson once and reach every student in your class — right here on the platform."}
            </p>
            <div className="mt-3 flex gap-4">
              <Link
                href={`/${lang}/stream/teach`}
                className={buttonVariants({ size: "lg" })}
              >
                {dictionary?.teachingHero?.cta || "Start teaching"}
              </Link>
              <Link
                href={`/${lang}/stream/courses`}
                className={buttonVariants({ size: "lg", variant: "ghost" })}
              >
                {dictionary?.teachingHero?.learnMore || "Browse courses"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
