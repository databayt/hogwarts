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
    title: "AI & Machine Learning",
    href: "/courses?category=ai",
    icon: AnthropicIcons.Sparkle,
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
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isRTL = lang === "ar"

  // Auto-scroll to bring search bar to comfortable position when dropdown opens
  React.useEffect(() => {
    if (isDropdownOpen && containerRef.current) {
      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const scrollTop = window.scrollY + rect.top - 100 // 100px offset from top for comfortable viewing

      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    }
  }, [isDropdownOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
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
    <div ref={containerRef} className={cn("relative w-full max-w-2xl mx-auto", className)}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "flex items-center w-full rounded-full border transition-colors",
            isFocused ? "border-foreground" : "border-input",
            "bg-background"
          )}
        >
          {/* Explore Button */}
          <button
            type="button"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              "flex items-center gap-1 h-11 px-4 rounded-none transition-colors shrink-0",
              "bg-transparent hover:bg-muted",
              isDropdownOpen && "bg-muted",
              isRTL ? "rounded-r-full order-last" : "rounded-l-full"
            )}
          >
            <span className="font-medium text-sm">
              {dictionary?.explore?.title || "Explore"}
            </span>
            <ChevronDown
              className={cn(
                "size-3 transition-transform duration-200",
                isDropdownOpen && "rotate-180"
              )}
            />
          </button>

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
        </div>
      </form>

      {/* Dropdown Menu - Anthropic Style */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
            className="absolute left-0 right-0 top-full mt-3 z-50"
          >
            <div className="w-full rounded-2xl border border-border/50 bg-background shadow-xl p-6">

              {/* Recently Viewed & Recommended - Side by Side */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.05 }}
                className="mb-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  {/* Recently Viewed */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                      {dictionary?.explore?.recent || "Recently viewed"}
                    </p>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <Link
                        href={`/${lang}/stream/courses`}
                        onClick={handleLinkClick}
                        className="group flex gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        <div className="size-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={recentCourse.image}
                            alt={recentCourse.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: 0.11, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <Link
                        href={`/${lang}/stream/courses`}
                        onClick={handleLinkClick}
                        className="group flex gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        <div className="size-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={recommendedCourse.image}
                            alt={recommendedCourse.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
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
              <div className="h-px bg-border/50 mb-6" />

              {/* Categories - Anthropic Icons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.1 }}
                className="mb-6"
              >
                <div className="grid grid-cols-4 gap-2">
                  {quickLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: 0.12 + index * 0.03, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <Link
                        href={`/${lang}/stream${link.href}`}
                        onClick={handleLinkClick}
                        className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        <div className="size-12 rounded-xl bg-muted/50 group-hover:bg-muted flex items-center justify-center transition-colors duration-200">
                          <link.icon className="size-5 text-foreground/70 group-hover:text-foreground transition-colors duration-200" />
                        </div>
                        <span className="text-xs font-medium text-foreground/70 group-hover:text-foreground transition-colors duration-200 text-center leading-tight">
                          {link.title}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Divider */}
              <div className="h-px bg-border/50 mb-6" />

              {/* Popular Searches */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.15 }}
              >
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  {dictionary?.explore?.popular || "Popular"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term, index) => (
                    <motion.button
                      key={term}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.12, delay: 0.18 + index * 0.02, ease: [0.23, 1, 0.32, 1] }}
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
        )}
      </AnimatePresence>

      {/* Overlay with opacity to close dropdown when clicking outside */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
