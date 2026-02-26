"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type {
  CatalogChapterItem,
  CatalogSubjectSummary,
} from "./catalog-detail"
import { ChapterSection } from "./catalog-detail"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  subject: CatalogSubjectSummary
  chapters: CatalogChapterItem[]
  lang: Locale
}

export function CatalogChaptersContent({ subject, chapters, lang }: Props) {
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog as
    | Record<string, string>
    | undefined
  const [activeChapter, setActiveChapter] = useState<string | null>(
    chapters[0]?.slug ?? null
  )

  const t = useMemo(
    () => ({
      min: cat?.min || "min",
      videos: cat?.videos || "videos",
      resources: cat?.resources || "resources",
      exploreMaterial: cat?.exploreMaterial || "Explore Material",
      exploreDescription: (
        cat?.exploreDescription || "Explore {name} material and videos"
      ).replace("{name}", subject.name),
    }),
    [cat, subject.name]
  )

  // Track active chapter on scroll for sidebar indicator
  useEffect(() => {
    if (chapters.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const slug = entry.target.id.replace("chapter-", "")
            setActiveChapter(slug)
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )

    for (const ch of chapters) {
      const el = document.getElementById(`chapter-${ch.slug}`)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [chapters])

  return (
    <div id="all-chapters">
      <div className="flex gap-8">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="space-y-8">
            {chapters.map((chapter) => (
              <ChapterSection
                key={chapter.id}
                chapter={chapter}
                subjectColor={subject.color}
                t={t}
              />
            ))}
          </div>

          {/* Bottom CTA bar */}
          <div
            className="mt-12 flex items-center justify-between rounded-lg px-6 py-4"
            style={{ backgroundColor: subject.color ?? "#1e40af" }}
          >
            <p className="text-base font-semibold text-white">
              {t.exploreDescription}
            </p>
            <Link
              href={`../${subject.slug}`}
              className="bg-background text-foreground border-foreground shrink-0 rounded-sm border px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-90"
            >
              {t.exploreMaterial}
            </Link>
          </div>
        </div>

        {/* Sidebar nav */}
        <aside className="sticky top-24 hidden w-48 shrink-0 self-start lg:block">
          <p className="mb-2 text-sm font-semibold">{subject.name}</p>
          <nav className="relative">
            <span className="border-muted-foreground/20 absolute start-0 top-3 bottom-3 border-s" />
            {chapters.map((ch) => {
              const isActive = activeChapter === ch.slug
              return (
                <a
                  key={ch.id}
                  href={`#chapter-${ch.slug}`}
                  className={`relative flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="bg-foreground absolute start-[-5px] top-1/2 size-2.5 -translate-y-1/2 rounded-full" />
                  )}
                  <span className="line-clamp-1">{ch.name}</span>
                </a>
              )
            })}
          </nav>
        </aside>
      </div>
    </div>
  )
}
