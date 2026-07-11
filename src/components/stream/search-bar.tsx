"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, ChevronDown, Search as SearchIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  lang: string
  // The `stream` dictionary subtree.
  dictionary?: any
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

export function SearchBar({ lang, dictionary, className }: SearchBarProps) {
  const router = useRouter()
  const d = dictionary?.search ?? {}
  const [query, setQuery] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [yOffset, setYOffset] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isRTL = lang === "ar"

  const popularTerms: string[] =
    Array.isArray(d.terms) && d.terms.length > 0
      ? d.terms
      : DEFAULT_POPULAR_TERMS

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsDropdownOpen(false)
      router.push(
        `/${lang}/stream/courses?search=${encodeURIComponent(query.trim())}`
      )
    }
  }

  const handleClear = () => {
    setQuery("")
    inputRef.current?.focus()
  }

  const handleQuickSearch = (term: string) => {
    setIsDropdownOpen(false)
    router.push(`/${lang}/stream/courses?search=${encodeURIComponent(term)}`)
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
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={d.placeholder || "What do you want to learn?"}
                className={cn(
                  "h-11 w-full border-0 bg-transparent text-sm outline-none",
                  "placeholder:text-muted-foreground",
                  "ps-4 pe-12 text-start"
                )}
                aria-label={d.ariaLabel || "Search courses"}
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

        {/* Expandable Dropdown — popular searches + browse-all. Deliberately
            no "recently viewed"/"recommended"/category cards: those were
            hardcoded placeholder courses with external images and category
            links that matched no real catalog department. */}
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

                <div className="p-6">
                  {/* Popular Searches with staggered pill animation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                      {d.popular || "Popular"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularTerms.map((term, index) => (
                        <motion.button
                          key={term}
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.2 + index * 0.04,
                            duration: 0.2,
                          }}
                          onClick={() => handleQuickSearch(term)}
                          className="bg-muted/50 hover:bg-muted text-foreground/80 hover:text-foreground rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                        >
                          {term}
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
                      href={`/${lang}/stream/courses`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                    >
                      {d.browseAll || "Browse all courses"}
                      <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
