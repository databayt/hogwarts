"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Search as SearchIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnthropicIcons } from "@/components/icons"

interface SearchBarProps {
  lang: string
  dictionary?: any
  className?: string
}

const quickLinks = [
  {
    title: "Engineering",
    href: "/courses?category=engineering",
    icon: AnthropicIcons.Gear,
  },
  {
    title: "Data Science",
    href: "/courses?category=data-science",
    icon: AnthropicIcons.BarChart,
  },
  {
    title: "Business",
    href: "/courses?category=business",
    icon: AnthropicIcons.Briefcase,
  },
  {
    title: "Development",
    href: "/courses?category=development",
    icon: AnthropicIcons.CodeWindow,
  },
]

const popularSearches = [
  "Python",
  "Excel",
  "Data Analysis",
  "Project Management",
  "Machine Learning",
  "SQL",
]

const recentCourse = {
  title: "Introduction to AI",
  category: "Technology",
  image:
    "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/f4/6b2dde582549308d4a217c0686e215/Professional_Certificate_Image_1200x1200.jpg?auto=format%2C%20compress%2C%20enhance&dpr=1&w=320&h=180&fit=crop&q=50",
  rating: 4.8,
}

const recommendedCourse = {
  title: "Business Analytics",
  category: "Business",
  image:
    "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/72/c2e795cd584b74accb5937ae2ac8c0/GwG_Career_Certs_Coursera_PME_Overall_Course_1x1.jpg?auto=format%2C%20compress%2C%20enhance&dpr=1&w=320&h=180&fit=crop&q=50",
  rating: 4.9,
}

export function SearchBar({ lang, dictionary, className }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [yOffset, setYOffset] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const id = React.useId()
  const isRTL = lang === "ar"

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

  const handleLinkClick = () => {
    setIsDropdownOpen(false)
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
        className={cn("relative z-50 mx-auto w-full max-w-2xl", className)}
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
                {dictionary?.explore?.title || "Explore"}
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
                placeholder={
                  dictionary?.search?.placeholder ||
                  "What do you want to learn?"
                }
                className={cn(
                  "h-11 w-full border-0 bg-transparent text-sm outline-none",
                  "placeholder:text-muted-foreground",
                  "ps-4 pe-12 text-start"
                )}
                aria-label={dictionary?.search?.ariaLabel || "Search courses"}
              />

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="hover:bg-muted absolute end-12 flex size-6 items-center justify-center rounded-full transition-colors"
                  aria-label={dictionary?.search?.clear || "Clear search"}
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
              aria-label={dictionary?.search?.submit || "Search"}
            >
              <SearchIcon className="size-4" />
            </Button>
          </motion.div>
        </form>

        {/* Expandable Dropdown - Aceternity Style */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              ref={dropdownRef}
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
                {/* Close Button - positioned relative to this card container */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  onClick={() => setIsDropdownOpen(false)}
                  className="bg-muted hover:bg-muted/80 absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full transition-colors"
                >
                  <X className="size-4" />
                </motion.button>

                <div className="p-6">
                  {/* Recently Viewed & Recommended - Side by Side */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="mb-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      {/* Recently Viewed */}
                      <div>
                        <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                          {dictionary?.explore?.recent || "Recently viewed"}
                        </p>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          <Link
                            href={`/${lang}/stream/courses`}
                            onClick={handleLinkClick}
                            className="group hover:bg-muted/50 flex gap-3 rounded-xl p-2 transition-all duration-200"
                          >
                            <motion.div
                              className="bg-muted size-16 shrink-0 overflow-hidden rounded-lg"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={recentCourse.image}
                                alt={recentCourse.title}
                                className="h-full w-full object-cover"
                              />
                            </motion.div>
                            <div className="flex min-w-0 flex-col justify-center gap-1">
                              <p className="group-hover:text-foreground truncate text-sm font-medium transition-colors duration-200">
                                {recentCourse.title}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {recentCourse.category}
                              </p>
                              <div className="flex items-center gap-1">
                                <AnthropicIcons.Sparkle className="text-foreground size-3 fill-current" />
                                <span className="text-xs font-medium">
                                  {recentCourse.rating}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      </div>

                      {/* Recommended */}
                      <div>
                        <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                          {dictionary?.explore?.recommended || "Recommended"}
                        </p>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25, duration: 0.3 }}
                        >
                          <Link
                            href={`/${lang}/stream/courses`}
                            onClick={handleLinkClick}
                            className="group hover:bg-muted/50 flex gap-3 rounded-xl p-2 transition-all duration-200"
                          >
                            <motion.div
                              className="bg-muted size-16 shrink-0 overflow-hidden rounded-lg"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={recommendedCourse.image}
                                alt={recommendedCourse.title}
                                className="h-full w-full object-cover"
                              />
                            </motion.div>
                            <div className="flex min-w-0 flex-col justify-center gap-1">
                              <p className="group-hover:text-foreground truncate text-sm font-medium transition-colors duration-200">
                                {recommendedCourse.title}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {recommendedCourse.category}
                              </p>
                              <div className="flex items-center gap-1">
                                <AnthropicIcons.Sparkle className="text-foreground size-3 fill-current" />
                                <span className="text-xs font-medium">
                                  {recommendedCourse.rating}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Divider */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="bg-border/50 mb-6 h-px origin-left"
                  />

                  {/* Categories - Anthropic Icons with staggered animation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    className="mb-6"
                  >
                    <div className="grid grid-cols-4 gap-2">
                      {quickLinks.map((link, index) => (
                        <motion.div
                          key={link.href}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.4 + index * 0.05,
                            duration: 0.3,
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                          }}
                        >
                          <Link
                            href={`/${lang}/stream${link.href}`}
                            onClick={handleLinkClick}
                            className="group hover:bg-muted/50 flex flex-col items-center gap-3 rounded-xl p-4 transition-all duration-200"
                          >
                            <motion.div
                              className="bg-muted/50 group-hover:bg-muted flex size-12 items-center justify-center rounded-xl transition-colors duration-200"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <link.icon className="text-foreground/70 group-hover:text-foreground size-5 transition-colors duration-200" />
                            </motion.div>
                            <span className="text-foreground/70 group-hover:text-foreground text-center text-xs leading-tight font-medium transition-colors duration-200">
                              {link.title}
                            </span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Divider */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.55, duration: 0.3 }}
                    className="bg-border/50 mb-6 h-px origin-right"
                  />

                  {/* Popular Searches with staggered pill animation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                      {dictionary?.explore?.popular || "Popular"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((term, index) => (
                        <motion.button
                          key={term}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.65 + index * 0.04,
                            duration: 0.2,
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleQuickSearch(term)}
                          className="text-foreground/70 bg-muted/50 hover:bg-muted hover:text-foreground rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200"
                        >
                          {term}
                        </motion.button>
                      ))}
                    </div>
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
