"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, ChevronDown, Search as SearchIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { CatalogCourseType } from "@/components/lumos/data/catalog/get-all-courses"
import { fetchCatalogCourses } from "@/components/lumos/lib/course-search-client"

/** The `lumos.search` dictionary subtree, as this component reads it. */
interface SearchDictionary {
  explore?: string
  placeholder?: string
  ariaLabel?: string
  clear?: string
  submit?: string
  close?: string
  popular?: string
  browseAll?: string
  featured?: string
  results?: string
  noResults?: string
  seeAllResults?: string
  /** Template with an `{n}` placeholder, e.g. "Grade {n}". */
  gradeLabel?: string
  terms?: string[]
}

/** The slices of the `lumos` dictionary a course meta line reads. */
interface MetaDictionary {
  search?: Pick<SearchDictionary, "gradeLabel">
  course?: { lessons?: string }
  courseLevels?: Record<string, string>
}

type LumosDictionary = MetaDictionary & { search?: SearchDictionary }

interface SearchBarProps {
  lang: string
  /** The `lumos` dictionary subtree. */
  dictionary?: LumosDictionary
  /**
   * Grade the grid is currently showing, so Explore offers what is actually on
   * the shelf. Passed in rather than read off `?level=` because the page
   * DEFAULTS that param (see `list-params.ts`) — reading the URL here would
   * show an all-grades shelf next to a grade-1 grid.
   */
  grade?: number
  className?: string
}

// Quick-search chips when the dictionary carries none. Terms run through the
// same bilingual course search as typed queries — they are suggestions, not
// fabricated catalog entries.
const DEFAULT_POPULAR_TERMS = [
  "Math",
  "Science",
  "English",
  "Arabic",
  "History",
  "Geography",
]

/** Shortest query worth a round-trip — one letter matches half the catalog. */
const MIN_QUERY_LENGTH = 2
/** Keystrokes settle before the fetch fires. */
const SUGGEST_DEBOUNCE_MS = 250
const SUGGEST_LIMIT = 6
const FEATURED_LIMIT = 6

export function SearchBar({
  lang,
  dictionary,
  grade,
  className,
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const d: SearchDictionary = dictionary?.search ?? {}
  const [isFocused, setIsFocused] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [yOffset, setYOffset] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isRTL = lang === "ar"

  // The box mirrors the URL: landing on `?search=algebra` (a shared link, the
  // back button, a popular chip) must show the term that produced the results,
  // and clearing it has to be able to take that term out of the URL again.
  const urlSearch = searchParams.get("search") ?? ""
  const [query, setQuery] = React.useState(urlSearch)
  const [prevUrlSearch, setPrevUrlSearch] = React.useState(urlSearch)
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    setQuery(urlSearch)
  }

  const popularTerms: string[] =
    Array.isArray(d.terms) && d.terms.length > 0
      ? d.terms
      : DEFAULT_POPULAR_TERMS

  const term = query.trim()
  const isSuggesting = term.length >= MIN_QUERY_LENGTH

  const [suggestions, setSuggestions] = React.useState<CatalogCourseType[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  // Same term typed twice (backspace, chip click, re-focus) must not re-query.
  const suggestionCache = React.useRef(new Map<string, CatalogCourseType[]>())

  const [featured, setFeatured] = React.useState<CatalogCourseType[]>([])
  const featuredRequested = React.useRef(false)

  // Typeahead. Debounced, cached, and aborted on every new keystroke so a slow
  // response for "ma" can never overwrite the results for "math".
  React.useEffect(() => {
    if (!isSuggesting) {
      setSuggestions([])
      setIsLoadingSuggestions(false)
      return
    }

    const key = `${lang}|${term.toLowerCase()}`
    const cached = suggestionCache.current.get(key)
    if (cached) {
      setSuggestions(cached)
      setIsLoadingSuggestions(false)
      return
    }

    const controller = new AbortController()
    setIsLoadingSuggestions(true)
    const timer = setTimeout(async () => {
      try {
        const { rows } = await fetchCatalogCourses({
          q: term,
          perPage: SUGGEST_LIMIT,
          lang,
          signal: controller.signal,
        })
        suggestionCache.current.set(key, rows)
        setSuggestions(rows)
      } catch {
        if (!controller.signal.aborted) setSuggestions([])
      } finally {
        if (!controller.signal.aborted) setIsLoadingSuggestions(false)
      }
    }, SUGGEST_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term, isSuggesting, lang])

  // Featured thumbnails, fetched on the first open only — the dropdown is a
  // browse affordance, so it must not cost anything until someone opens it.
  React.useEffect(() => {
    if (!isDropdownOpen || featuredRequested.current) return
    featuredRequested.current = true
    const controller = new AbortController()
    fetchCatalogCourses({
      // Over-fetch: the catalog carries the same subject once per grade, and
      // a shelf reading "Arabic, English, Arabic, English" is noise — six
      // DISTINCT subjects need more than six rows to pick from.
      perPage: FEATURED_LIMIT * 3,
      grade,
      lang,
      signal: controller.signal,
    })
      .then(({ rows }) => setFeatured(dedupeByTitle(rows, FEATURED_LIMIT)))
      .catch(() => {
        // Let the next open try again rather than leaving an empty shelf.
        featuredRequested.current = false
      })
    return () => controller.abort()
  }, [isDropdownOpen, grade, lang])

  // A grade change invalidates the shelf that was fetched for the old grade.
  React.useEffect(() => {
    featuredRequested.current = false
    setFeatured([])
  }, [grade, lang])

  React.useEffect(() => {
    setActiveIndex(-1)
  }, [term])

  // Calculate Y offset to center the search bar + dropdown
  React.useEffect(() => {
    if (isDropdownOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const elementTop = rect.top
      const targetTop = viewportHeight * 0.15 // Position at 15% from top of viewport
      const offset = targetTop - elementTop
      setYOffset(offset)
    } else {
      setYOffset(0)
    }
  }, [isDropdownOpen])

  // Handle escape key to close dropdown
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isDropdownOpen])

  // Restore page scrolling if the bar unmounts while the dropdown is open
  // (navigating to a suggestion does exactly that).
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  // Navigate to the courses page in search mode, PRESERVING the existing
  // params (grade level, etc.) so a search keeps its browsing context and
  // clearing it returns there. `page` is dropped so results start at page 1.
  const navigateToSearch = React.useCallback(
    (searchTerm: string) => {
      const trimmed = searchTerm.trim()
      if (!trimmed) return
      const params = new URLSearchParams(searchParams.toString())
      params.set("search", trimmed)
      params.delete("page")
      setIsDropdownOpen(false)
      router.push(`/${lang}/lumos/courses?${params.toString()}`)
    },
    [router, searchParams, lang]
  )

  const courseHref = React.useCallback(
    (course: CatalogCourseType) => `/${lang}/lumos/courses/${course.slug}`,
    [lang]
  )

  const openCourse = React.useCallback(
    (course: CatalogCourseType) => {
      setIsDropdownOpen(false)
      router.push(courseHref(course))
    },
    [router, courseHref]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      openCourse(suggestions[activeIndex])
      return
    }
    navigateToSearch(query)
  }

  // Clearing the box also drops `search` from the URL, so the grid goes back to
  // browsing instead of leaving stale results under an empty input.
  const handleClear = () => {
    setQuery("")
    inputRef.current?.focus()
    if (urlSearch) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("search")
      params.delete("page")
      const qs = params.toString()
      router.push(`/${lang}/lumos/courses${qs ? `?${qs}` : ""}`)
    }
  }

  const handleQuickSearch = (quickTerm: string) => {
    navigateToSearch(quickTerm)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (value.trim().length >= MIN_QUERY_LENGTH) setIsDropdownOpen(true)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggesting || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setIsDropdownOpen(true)
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    }
  }

  return (
    <>
      {/* Backdrop overlay with blur */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Search Bar Container - Animates Y position when open */}
      <motion.div
        ref={containerRef}
        animate={{
          y: yOffset,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={cn(
          "relative mx-auto w-full max-w-2xl",
          isDropdownOpen ? "z-50" : "z-0",
          className
        )}
      >
        <form onSubmit={handleSubmit}>
          <motion.div
            layout
            className={cn(
              "flex w-full items-center rounded-full border transition-colors",
              isFocused || isDropdownOpen
                ? "border-foreground"
                : "border-input",
              "bg-background"
            )}
          >
            {/* Explore Button */}
            <motion.button
              layout
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              className={cn(
                "flex h-11 shrink-0 items-center gap-1 rounded-none px-4 transition-colors",
                "hover:bg-muted bg-transparent",
                isDropdownOpen && "bg-muted",
                isRTL ? "order-last rounded-e-full" : "rounded-s-full"
              )}
            >
              <motion.span layout className="text-sm font-medium">
                {d.explore || "Explore"}
              </motion.span>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="size-3" />
              </motion.div>
            </motion.button>

            {/* Vertical Separator */}
            <div
              className={cn("bg-border w-px self-stretch", isRTL && "order-2")}
            />

            {/* Search Input */}
            <div
              className={cn(
                "relative flex flex-1 items-center",
                isRTL && "order-1"
              )}
            >
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={d.placeholder || "What do you want to learn?"}
                className={cn(
                  "h-11 w-full border-0 bg-transparent text-sm outline-none",
                  "placeholder:text-muted-foreground",
                  "ps-4 pe-12 text-start"
                )}
                aria-label={d.ariaLabel || "Search courses"}
                autoComplete="off"
              />

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="hover:bg-muted absolute end-12 flex size-6 items-center justify-center rounded-full transition-colors"
                  aria-label={d.clear || "Clear search"}
                >
                  <X className="text-muted-foreground size-4" />
                </button>
              )}
            </div>

            {/* Search Button */}
            <Button
              type="submit"
              size="icon"
              className={cn(
                "bg-primary hover:bg-primary/90 size-9 shrink-0 rounded-full",
                isRTL ? "order-first ms-1" : "me-1"
              )}
              aria-label={d.submit || "Search"}
            >
              <SearchIcon className="size-4" />
            </Button>
          </motion.div>
        </form>

        {/* Expandable dropdown. Two faces of the same panel: typing shows
            matching courses, an empty box shows what is on the shelf. Both are
            real catalog rows read from `GET /api/lumos/course-search` — the
            cards this replaced were hardcoded placeholder courses with external
            images and category links that matched no real department, which is
            what the old "no cards here" note was guarding against. */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  delay: 0.1,
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: -10,
                transition: {
                  duration: 0.15,
                },
              }}
              className="mt-4"
            >
              <motion.div
                className="border-border/50 bg-background relative w-full overflow-hidden rounded-2xl border shadow-2xl"
                layout
              >
                {/* Close Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  onClick={() => setIsDropdownOpen(false)}
                  className="bg-muted hover:bg-muted/80 absolute end-4 top-4 z-10 flex size-8 items-center justify-center rounded-full transition-colors"
                  aria-label={d.close || "Close"}
                >
                  <X className="size-4" />
                </motion.button>

                <div className="max-h-[70vh] overflow-y-auto p-6">
                  {isSuggesting ? (
                    <SuggestionList
                      dictionary={d}
                      suggestions={suggestions}
                      isLoading={isLoadingSuggestions}
                      activeIndex={activeIndex}
                      onHover={setActiveIndex}
                      href={courseHref}
                      onNavigate={() => setIsDropdownOpen(false)}
                      onSeeAll={() => navigateToSearch(term)}
                      lang={lang}
                      dictionaryRoot={dictionary}
                    />
                  ) : (
                    <>
                      {/* Featured courses — real thumbnails off the CDN */}
                      {featured.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          className="mb-6"
                        >
                          <SectionLabel>
                            {d.featured || "Featured courses"}
                          </SectionLabel>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {featured.map((course, index) => (
                              <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: 0.12 + index * 0.04,
                                  duration: 0.2,
                                }}
                              >
                                <Link
                                  href={courseHref(course)}
                                  onClick={() => setIsDropdownOpen(false)}
                                  className="group block"
                                >
                                  <CourseThumb
                                    course={course}
                                    className="aspect-video w-full rounded-lg"
                                    sizes="(max-width: 640px) 45vw, 200px"
                                  />
                                  <p className="group-hover:text-primary mt-2 truncate text-xs font-medium transition-colors">
                                    {course.title}
                                  </p>
                                  <p className="text-muted-foreground truncate text-[11px]">
                                    {courseMeta(course, dictionary)}
                                  </p>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Popular Searches with staggered pill animation */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                      >
                        <SectionLabel>{d.popular || "Popular"}</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                          {popularTerms.map((popularTerm, index) => (
                            <motion.button
                              key={popularTerm}
                              type="button"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: 0.2 + index * 0.04,
                                duration: 0.2,
                              }}
                              onClick={() => handleQuickSearch(popularTerm)}
                              className="bg-muted/50 hover:bg-muted text-foreground/80 hover:text-foreground rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                            >
                              {popularTerm}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>

                      {/* Browse all courses */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35, duration: 0.3 }}
                        className="mt-6"
                      >
                        <Link
                          href={`/${lang}/lumos/courses`}
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                        >
                          {d.browseAll || "Browse all courses"}
                          <ArrowRight className="size-3.5 rtl:rotate-180" />
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

/** First N rows with distinct titles, in catalog order. */
function dedupeByTitle(
  rows: CatalogCourseType[],
  limit: number
): CatalogCourseType[] {
  const seen = new Set<string>()
  const out: CatalogCourseType[] = []
  for (const row of rows) {
    const key = row.title.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
    if (out.length === limit) break
  }
  return out
}

/**
 * What a course card says under its title. The GRADE leads: the catalog stores
 * one row per subject per grade, so a query for "math" returns six courses all
 * titled "Mathematics" and the grade is the only thing telling them apart.
 * Lesson count follows when the catalog has counted them; the department
 * ("Elementary") is the last resort because it repeats down a whole shelf.
 */
function courseMeta(
  course: CatalogCourseType,
  dictionaryRoot: MetaDictionary | undefined
): string | undefined {
  const parts: string[] = []

  const grade = course._catalog?.grades?.[0]
  if (grade) {
    const template = dictionaryRoot?.search?.gradeLabel
    parts.push(
      template ? template.replace("{n}", String(grade)) : `Grade ${grade}`
    )
  }

  const lessons = course._catalog?.totalLessons ?? 0
  const lessonsLabel = dictionaryRoot?.course?.lessons
  if (lessons > 0 && lessonsLabel) parts.push(`${lessons} ${lessonsLabel}`)

  if (parts.length > 0) return parts.join(" · ")

  const rawLevel = course._catalog?.levels?.[0]
  const levels = dictionaryRoot?.courseLevels
  if (rawLevel) return levels?.[rawLevel] ?? rawLevel
  return course.category?.name
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
      {children}
    </p>
  )
}

/**
 * Course artwork with the same fallback the grid cards use: a missing or
 * broken CDN thumbnail falls back to the subject's catalog colour rather than
 * a blank hole.
 */
function CourseThumb({
  course,
  className,
  sizes,
}: {
  course: CatalogCourseType
  className?: string
  sizes: string
}) {
  const [imageError, setImageError] = React.useState(false)
  const color = course._catalog?.color

  return (
    <div className={cn("bg-muted relative overflow-hidden", className)}>
      {course.imageUrl && !imageError ? (
        <Image
          src={course.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes={sizes}
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        <div
          className="h-full w-full"
          style={{ backgroundColor: color || undefined }}
        />
      )}
    </div>
  )
}

function SuggestionList({
  dictionary: d,
  dictionaryRoot,
  suggestions,
  isLoading,
  activeIndex,
  onHover,
  href,
  onNavigate,
  onSeeAll,
  lang,
}: {
  dictionary: SearchDictionary
  dictionaryRoot?: MetaDictionary
  suggestions: CatalogCourseType[]
  isLoading: boolean
  activeIndex: number
  onHover: (index: number) => void
  href: (course: CatalogCourseType) => string
  onNavigate: () => void
  onSeeAll: () => void
  lang: string
}) {
  if (isLoading && suggestions.length === 0) {
    return (
      <div>
        <SectionLabel>{d.results || "Courses"}</SectionLabel>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-12 w-20 shrink-0 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="py-2">
        <SectionLabel>{d.results || "Courses"}</SectionLabel>
        <p className="text-muted-foreground text-sm">
          {d.noResults || "No matching courses"}
        </p>
      </div>
    )
  }

  return (
    <div>
      <SectionLabel>{d.results || "Courses"}</SectionLabel>
      <ul className="-mx-2 space-y-1">
        {suggestions.map((course, index) => {
          return (
            <li key={course.id}>
              <Link
                href={href(course)}
                onClick={onNavigate}
                onMouseEnter={() => onHover(index)}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2 transition-colors",
                  index === activeIndex ? "bg-muted" : "hover:bg-muted/60"
                )}
              >
                <CourseThumb
                  course={course}
                  className="h-12 w-20 shrink-0 rounded-md"
                  sizes="80px"
                />
                <div className="min-w-0 flex-1 text-start">
                  <p className="truncate text-sm font-medium">{course.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {courseMeta(course, dictionaryRoot)}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={onSeeAll}
        className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        {d.seeAllResults || "See all results"}
        <ArrowRight className={cn("size-3.5", lang === "ar" && "rotate-180")} />
      </button>
    </div>
  )
}
