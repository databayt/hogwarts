// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition with no client hooks/handlers, so
// it stays out of the client bundle and only its interactive leaves hydrate.
import Link from "next/link"

import { asset } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { CatalogCourseType } from "../data/catalog/get-all-courses"
import type { ContinueWatchingItem } from "../data/catalog/get-continue-watching"
import type { LumosContentProps } from "../types"
import { ContinueWatchingSection } from "./continue-watching-section"
import { CurriculumSection } from "./curriculum-section"
import { EducationAnimation } from "./education-animation"
import { HotReleasesSection } from "./hot-releases-section"
import { HowToBeginSection } from "./how-to-begin-section"
import { ReasonsSection } from "./reasons-section"
import { TeachingHeroSection } from "./teaching-hero-section"

type Feature = {
  title: string
  description: string
  icon: string | React.ReactNode
}

// SVG feature icons hosted on CloudFront — shared with the Android app.
// Source files live in public/icons/ and are uploaded via scripts/migrate-assets-to-s3.ts.
// The objects are still named `stream-*.svg` and were deliberately NOT renamed
// with the block: `asset()` has no fallback and a missing CDN key returns 403,
// not 404, so renaming these strings blanks all four icons. Publish new CDN
// objects first if you want the names to match.
const featureIconUrls = [
  asset("https://cdn.databayt.org/anthropic/stream-curated-courses.svg"),
  asset("https://cdn.databayt.org/anthropic/stream-interactive-learning.svg"),
  asset("https://cdn.databayt.org/anthropic/stream-progress-tracking.svg"),
  asset("https://cdn.databayt.org/anthropic/stream-community.svg"),
]

interface LumosHomeProps extends LumosContentProps {
  isAuthenticated?: boolean
  isAdmin?: boolean
  continueWatching?: ContinueWatchingItem[]
  /** Real courses from this school's catalog selection (see the lumos page). */
  featuredCourses?: CatalogCourseType[]
}

export function LumosHomeContent({
  dictionary,
  lang,
  schoolId,
  isAuthenticated = false,
  isAdmin = false,
  continueWatching = [],
  featuredCourses = [],
}: LumosHomeProps) {
  // Get features from dictionary or use defaults
  const features: Feature[] = dictionary?.home?.features || [
    {
      title: "Curated Courses",
      description:
        "Access a wide range of carefully curated courses designed by industry experts.",
      icon: "📚",
    },
    {
      title: "Interactive Learning",
      description:
        "Engage with interactive content, quizzes, and hands-on assignments.",
      icon: "🎯",
    },
    {
      title: "Progress Tracking",
      description:
        "Monitor your progress and achievements with detailed analytics.",
      icon: "📊",
    },
    {
      title: "Community Support",
      description:
        "Join a vibrant community of learners and instructors to collaborate.",
      icon: "👥",
    },
  ]

  const isRTL = lang === "ar"

  // Rendered width of each headline line, per 100px of font size, measured in
  // the browser against thmanyah sans at the weights the h1 actually uses:
  // the brand line at 700, the tagline at 300. Dividing them gives the `em`
  // size that makes the tagline exactly as wide as the brand above it.
  const HEADLINE_WIDTHS: Record<string, { brand: number; tagline: number }> = {
    ar: { brand: 310.4, tagline: 347.4 },
    en: { brand: 314.4, tagline: 584.8 },
  }
  const widths = HEADLINE_WIDTHS[lang] ?? HEADLINE_WIDTHS.en
  const headlineRatio = (widths.brand / widths.tagline).toFixed(4)

  return (
    <>
      {/* Hero Section with Animation */}
      <section className="relative">
        <div className="flex flex-row items-center gap-4 sm:gap-8 lg:gap-16">
          {/* Text Content */}
          <div className="flex flex-1 flex-col items-start space-y-4 ps-3 text-start sm:space-y-6 sm:ps-0">
            {/* The /live banner's headline, and its trick: two lines set to
                the SAME WIDTH, so the type stacks into a tidy block rather
                than a ragged one. That hero gets there by authoring copy of
                equal length (a tatweel stretches its short word); ours can't
                — "Lumos" and "Shine a light." are fixed names — so the second
                line is sized as a fraction of the first instead. The ratio is
                per language because the two scripts set at wildly different
                widths, and both lines are then equal at EVERY breakpoint
                without a second ladder, since the tagline's size is an `em` of
                the h1's own.

                The face is thmanyah sans, vendored in `public/fonts/` and
                declared by `src/styles/thmanyah-clone.css` (imported by the
                ROOT layout), so it costs this page nothing to use. Weights
                700 and 300 are real faces in the family — the ratios below
                were measured against those two, so changing either weight,
                adding letter-spacing, or rewriting the strings breaks the
                match. Re-measure with a canvas if you change any of them. */}
            <h1
              className="text-[2.5rem] leading-[1.05] font-bold sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ fontFamily: '"thmanyah sans", sans-serif' }}
            >
              {dictionary?.home?.title || "Lumos"}
              <span
                className="mt-2 block font-light"
                style={{ fontSize: `${headlineRatio}em` }}
              >
                {dictionary?.home?.description || "Shine a light."}
              </span>
            </h1>

            {/* Phones get the one-word labels from the header namespace: two
                full-size buttons don't fit side by side in the hero's half. */}
            <div className="flex flex-row gap-2 sm:gap-4">
              <Link
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-7 px-2.5 text-xs sm:h-10 sm:px-6 sm:text-sm"
                )}
                href={`/${lang}/lumos/courses`}
              >
                <span className="sm:hidden">
                  {dictionary?.header?.courses || "Courses"}
                </span>
                <span className="hidden sm:inline">
                  {dictionary?.home?.exploreCourses || "Explore Courses"}
                </span>
              </Link>

              {isAdmin || isAuthenticated ? (
                <Link
                  className={cn(
                    buttonVariants({ size: "lg", variant: "ghost" }),
                    "h-7 px-2.5 text-xs sm:h-10 sm:px-6 sm:text-sm"
                  )}
                  href={`/${lang}/lumos/dashboard`}
                >
                  {dictionary?.header?.dashboard ?? "Dashboard"}
                </Link>
              ) : null}
            </div>
          </div>

          {/* Animation */}
          <div className="flex flex-1 justify-center">
            <EducationAnimation className="h-32 w-full max-w-md sm:h-58 md:h-70 rtl:[transform:scaleX(-1)]" />
          </div>
        </div>
      </section>

      <section className="mt-10 mb-32 grid grid-cols-2 gap-3 sm:mt-0 sm:gap-6 lg:grid-cols-4">
        {features.map((feature, index) => {
          const iconUrl = featureIconUrls[index]
          return (
            <Card
              key={index}
              className="hover:border-foreground border shadow-none transition-colors"
            >
              <CardHeader className="p-4 sm:p-6">
                <div className="text-foreground mb-2 h-8 w-8 text-start sm:mb-4 sm:h-12 sm:w-12">
                  {iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="h-8 w-8 sm:h-12 sm:w-12"
                    />
                  ) : (
                    <span className="text-2xl sm:text-4xl">{feature.icon}</span>
                  )}
                </div>
                <CardTitle className="text-start text-sm sm:text-base">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <p className="text-muted-foreground text-start text-xs sm:text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {continueWatching.length > 0 && (
        <ContinueWatchingSection
          items={continueWatching}
          lang={lang}
          dictionary={dictionary}
        />
      )}

      <HotReleasesSection
        dictionary={dictionary}
        lang={lang}
        courses={featuredCourses}
      />

      <CurriculumSection dictionary={dictionary} lang={lang} />

      <TeachingHeroSection dictionary={dictionary} lang={lang} />

      <ReasonsSection dictionary={dictionary} lang={lang} />

      <HowToBeginSection dictionary={dictionary} lang={lang} />
    </>
  )
}
