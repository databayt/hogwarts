"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import type { Locale } from "@/components/internationalization/config"

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
  const isRTL = lang === "ar"
  const [activeChapter, setActiveChapter] = useState<string | null>(
    chapters[0]?.slug ?? null
  )

  const t = useMemo(
    () => ({
      min: isRTL ? "\u062f" : "min",
      videos: isRTL
        ? "\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a"
        : "videos",
      resources: isRTL ? "\u0645\u0648\u0627\u0631\u062f" : "resources",
      exploreMaterial: isRTL
        ? "\u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u0645\u0627\u062f\u0629"
        : "Explore Material",
    }),
    [isRTL]
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
    <>
      <div id="all-chapters">
        <div className="flex gap-8">
          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-8">
            {chapters.map((chapter) => (
              <ChapterSection
                key={chapter.id}
                chapter={chapter}
                subjectColor={subject.color}
                t={t}
              />
            ))}
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

      {/* Bottom CTA bar */}
      <div
        className="mt-8 rounded-lg px-6 py-4 text-center"
        style={{ backgroundColor: subject.color ?? "#1e40af" }}
      >
        <Link
          href="."
          className="inline-block rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
        >
          {t.exploreMaterial}
        </Link>
      </div>
    </>
  )
}
