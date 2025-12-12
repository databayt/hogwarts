"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search as SearchIcon, X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnthropicIcons } from "@/components/icons/anthropic"

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
  image: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/f4/6b2dde582549308d4a217c0686e215/Professional_Certificate_Image_1200x1200.jpg?auto=format%2C%20compress%2C%20enhance&dpr=1&w=320&h=180&fit=crop&q=50",
  rating: 4.8
}

const recommendedCourse = {
  title: "Business Analytics",
  category: "Business",
  image: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/72/c2e795cd584b74accb5937ae2ac8c0/GwG_Career_Certs_Coursera_PME_Overall_Course_1x1.jpg?auto=format%2C%20compress%2C%20enhance&dpr=1&w=320&h=180&fit=crop&q=50",
  rating: 4.9
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
      router.push(`/${lang}/stream/courses?search=${encodeURIComponent(query.trim())}`)
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
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-40"
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
        className={cn("relative w-full max-w-2xl mx-auto z-50", className)}
      >
        <form onSubmit={handleSubmit}>
          <motion.div
            layout
            className={cn(
              "flex items-center w-full rounded-full border transition-colors",
              isFocused || isDropdownOpen ? "border-foreground" : "border-input",
              "bg-background"
            )}
          >
            {/* Explore Button */}
            <motion.button
              layout
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                "flex items-center gap-1 h-11 px-4 rounded-none transition-colors shrink-0",
                "bg-transparent hover:bg-muted",
                isDropdownOpen && "bg-muted",
                isRTL ? "rounded-r-full order-last" : "rounded-l-full"
              )}
            >
              <motion.span layout className="font-medium text-sm">
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
            <div className={cn(
              "w-px bg-border self-stretch",
              isRTL && "order-2"
            )} />

            {/* Search Input */}
            <div className={cn(
              "relative flex-1 flex items-center",
              isRTL && "order-1"
            )}>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={dictionary?.search?.placeholder || "What do you want to learn?"}
                className={cn(
                  "w-full h-11 bg-transparent border-0 outline-none text-sm",
                  "placeholder:text-muted-foreground",
                  isRTL ? "pr-4 pl-12 text-right" : "pl-4 pr-12"
                )}
                aria-label={dictionary?.search?.ariaLabel || "Search courses"}
              />

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    "absolute flex items-center justify-center size-6 rounded-full hover:bg-muted transition-colors",
                    isRTL ? "left-12" : "right-12"
                  )}
                  aria-label={dictionary?.search?.clear || "Clear search"}
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Search Button */}
            <Button
              type="submit"
              size="icon"
              className={cn(
                "size-9 rounded-full bg-primary hover:bg-primary/90 shrink-0",
                isRTL ? "ml-1 order-first" : "mr-1"
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
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: -10,
                transition: {
                  duration: 0.15,
                }
              }}
              className="mt-4"
            >
              <motion.div
                className="relative w-full rounded-2xl border border-border/50 bg-background shadow-2xl overflow-hidden"
                layout
              >
                {/* Close Button - positioned relative to this card container */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  onClick={() => setIsDropdownOpen(false)}
                  className="absolute top-4 right-4 z-10 flex items-center justify-center size-8 rounded-full bg-muted hover:bg-muted/80 transition-colors"
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
                        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
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
                            className="group flex gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
                          >
                            <motion.div
                              className="size-16 rounded-lg overflow-hidden shrink-0 bg-muted"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={recentCourse.image}
                                alt={recentCourse.title}
                                className="w-full h-full object-cover"
                              />
                            </motion.div>
                            <div className="flex flex-col justify-center min-w-0 gap-1">
                              <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors duration-200">
                                {recentCourse.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {recentCourse.category}
                              </p>
                              <div className="flex items-center gap-1">
                                <AnthropicIcons.Sparkle className="size-3 fill-current text-foreground" />
                                <span className="text-xs font-medium">{recentCourse.rating}</span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      </div>

                      {/* Recommended */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
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
                            className="group flex gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
                          >
                            <motion.div
                              className="size-16 rounded-lg overflow-hidden shrink-0 bg-muted"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={recommendedCourse.image}
                                alt={recommendedCourse.title}
                                className="w-full h-full object-cover"
                              />
                            </motion.div>
                            <div className="flex flex-col justify-center min-w-0 gap-1">
                              <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors duration-200">
                                {recommendedCourse.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {recommendedCourse.category}
                              </p>
                              <div className="flex items-center gap-1">
                                <AnthropicIcons.Sparkle className="size-3 fill-current text-foreground" />
                                <span className="text-xs font-medium">{recommendedCourse.rating}</span>
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
                    className="h-px bg-border/50 mb-6 origin-left"
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
                            damping: 20
                          }}
                        >
                          <Link
                            href={`/${lang}/stream${link.href}`}
                            onClick={handleLinkClick}
                            className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200"
                          >
                            <motion.div
                              className="size-12 rounded-xl bg-muted/50 group-hover:bg-muted flex items-center justify-center transition-colors duration-200"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <link.icon className="size-5 text-foreground/70 group-hover:text-foreground transition-colors duration-200" />
                            </motion.div>
                            <span className="text-xs font-medium text-foreground/70 group-hover:text-foreground transition-colors duration-200 text-center leading-tight">
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
                    className="h-px bg-border/50 mb-6 origin-right"
                  />

                  {/* Popular Searches with staggered pill animation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
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
                            damping: 20
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleQuickSearch(term)}
                          className="px-3 py-1.5 text-sm font-medium text-foreground/70 bg-muted/50 rounded-full hover:bg-muted hover:text-foreground transition-all duration-200"
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
