// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition with no client hooks/handlers, so
// it stays out of the client bundle and only its interactive leaves hydrate.
import Link from "next/link"

import { asset } from "@/lib/asset-url"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { CatalogCourseType } from "../data/catalog/get-all-courses"
import type { ContinueWatchingItem } from "../data/catalog/get-continue-watching"
import type { StreamContentProps } from "../types"
import { ContinueWatchingSection } from "./continue-watching-section"
import { CurriculumSection } from "./curriculum-section"
import { EducationAnimation } from "./education-animation"
import { HotReleasesSection } from "./hot-releases-section"
import { HowToBeginSection } from "./how-to-begin-section"
import { TeachingHeroSection } from "./teaching-hero-section"

type Feature = {
  title: string
  description: string
  icon: string | React.ReactNode
}

// SVG feature icons hosted on CloudFront — shared with the Android app.
// Source files live in public/icons/ and are uploaded via scripts/migrate-assets-to-s3.ts.
const featureIconUrls = [
  asset("https://cdn.databayt.org/anthropic/stream-curated-courses.svg"),
  asset("https://cdn.databayt.org/anthropic/stream-interactive-learning.svg"),
  asset("https://cdn.databayt.org/anthropic/stream-progress-tracking.svg"),
  asset("https://cdn.databayt.org/anthropic/stream-community.svg"),
]

interface StreamHomeProps extends StreamContentProps {
  isAuthenticated?: boolean
  isAdmin?: boolean
  continueWatching?: ContinueWatchingItem[]
  /** Real courses from this school's catalog selection (see the stream page). */
  featuredCourses?: CatalogCourseType[]
}

export function StreamHomeContent({
  dictionary,
  lang,
  schoolId,
  isAuthenticated = false,
  isAdmin = false,
  continueWatching = [],
  featuredCourses = [],
}: StreamHomeProps) {
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

  return (
    <>
      {/* Hero Section with Animation */}
      <section className="relative">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
          {/* Text Content */}
          <div className="flex flex-1 flex-col items-start space-y-6 text-start">
            <h1 className="text-4xl leading-none font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              {dictionary?.home?.title || "Lumos"}
              <br />
              <span className="mt-2 block text-2xl font-semibold sm:text-3xl md:text-4xl lg:text-5xl">
                {dictionary?.home?.description || "Shine a light."}
              </span>
            </h1>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                className={buttonVariants({
                  size: "lg",
                })}
                href={`/${lang}/stream/courses`}
              >
                {dictionary?.home?.exploreCourses || "Explore Courses"}
              </Link>

              {isAdmin || isAuthenticated ? (
                <Link
                  className={buttonVariants({
                    size: "lg",
                    variant: "ghost",
                  })}
                  href={`/${lang}/stream/dashboard`}
                >
                  {dictionary?.header?.myLearning ?? "My Learning"}
                </Link>
              ) : null}
            </div>
          </div>

          {/* Animation */}
          <div className="flex flex-1 justify-center">
            <EducationAnimation className="h-58 w-full max-w-md md:h-70 rtl:[transform:scaleX(-1)]" />
          </div>
        </div>
      </section>

      <section className="mb-32 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => {
          const iconUrl = featureIconUrls[index]
          return (
            <Card
              key={index}
              className="hover:border-foreground border shadow-none transition-colors"
            >
              <CardHeader>
                <div className="text-foreground mb-4 h-12 w-12 text-start">
                  {iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12"
                    />
                  ) : (
                    <span className="text-4xl">{feature.icon}</span>
                  )}
                </div>
                <CardTitle className="text-start">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-start">
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

      <HowToBeginSection dictionary={dictionary} lang={lang} />
    </>
  )
}
