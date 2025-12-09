"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search as SearchIcon, X, Sparkles, TrendingUp, BookOpen, GraduationCap, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  lang: string
  dictionary?: any
  className?: string
}

const quickLinks = [
  {
    title: "AI & Machine Learning",
    href: "/courses?category=ai",
    icon: Sparkles,
    color: "text-violet-500"
  },
  {
    title: "Data Science",
    href: "/courses?category=data-science",
    icon: TrendingUp,
    color: "text-blue-500"
  },
  {
    title: "Business",
    href: "/courses?category=business",
    icon: BookOpen,
    color: "text-emerald-500"
  },
  {
    title: "Degrees",
    href: "/degrees",
    icon: GraduationCap,
    color: "text-amber-500"
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

const recentCourses = [
  { title: "Introduction to AI", category: "Technology" },
  { title: "Business Analytics", category: "Business" },
]

export function SearchBar({ lang, dictionary, className }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const isRTL = lang === "ar"

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
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
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

      {/* Dropdown Menu - Full Width */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
          className="absolute left-0 right-0 top-full mt-2 z-50"
        >
          <div className="w-full bg-muted rounded-xl shadow-lg p-4">
            {/* Quick Links with Icons */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={`/${lang}/stream${link.href}`}
                  onClick={handleLinkClick}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-background transition-colors text-center"
                >
                  <div className={cn("size-10 rounded-full bg-background flex items-center justify-center")}>
                    <link.icon className={cn("size-5", link.color)} />
                  </div>
                  <span className="text-xs font-medium">{link.title}</span>
                </Link>
              ))}
            </div>

            {/* Popular Searches */}
            <div className="pt-3 border-t border-background/50">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                {dictionary?.explore?.popular || "Popular searches"}
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQuickSearch(term)}
                    className="px-3 py-1.5 text-sm bg-background rounded-full hover:bg-accent transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent */}
            {recentCourses.length > 0 && (
              <div className="pt-3 mt-3 border-t border-background/50">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  {dictionary?.explore?.recent || "Recently viewed"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {recentCourses.map((course, i) => (
                    <Link
                      key={i}
                      href={`/${lang}/stream/courses`}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors"
                    >
                      <div className="size-10 rounded-lg bg-background flex items-center justify-center shrink-0">
                        <BookOpen className="size-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.category}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}
