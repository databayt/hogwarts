"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search as SearchIcon, X, Sparkles, TrendingUp, BookOpen, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

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
  const inputRef = React.useRef<HTMLInputElement>(null)
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
    router.push(`/${lang}/stream/courses?search=${encodeURIComponent(term)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative w-full max-w-2xl mx-auto", className)}
    >
      <div
        className={cn(
          "flex items-center w-full rounded-full border transition-colors",
          isFocused ? "border-foreground" : "border-input",
          "bg-background"
        )}
      >
        {/* Explore Button - Embedded */}
        <NavigationMenu className={cn(isRTL && "order-last")}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  "bg-transparent hover:bg-muted data-[state=open]:bg-muted",
                  "h-11 gap-1 rounded-none border-0 shadow-none",
                  isRTL
                    ? "rounded-r-full pl-3 pr-4"
                    : "rounded-l-full pl-4 pr-3"
                )}
              >
                <span className="font-medium text-sm">
                  {dictionary?.explore?.title || "Explore"}
                </span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="p-4 w-80">
                  {/* Quick Links with Icons */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {quickLinks.map((link) => (
                      <NavigationMenuLink key={link.href} asChild>
                        <Link
                          href={`/${lang}/stream${link.href}`}
                          className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-background transition-colors"
                        >
                          <link.icon className={cn("size-4", link.color)} />
                          <span className="text-sm font-medium">{link.title}</span>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>

                  {/* Popular Searches */}
                  <div className="pt-3 border-t border-background">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      {dictionary?.explore?.popular || "Popular searches"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleQuickSearch(term)}
                          className="px-2.5 py-1 text-xs bg-background rounded-full hover:bg-accent transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent */}
                  {recentCourses.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-background">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        {dictionary?.explore?.recent || "Recently viewed"}
                      </p>
                      <div className="space-y-1">
                        {recentCourses.map((course, i) => (
                          <Link
                            key={i}
                            href={`/${lang}/stream/courses`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-background transition-colors"
                          >
                            <div className="size-8 rounded bg-background flex items-center justify-center">
                              <BookOpen className="size-4 text-muted-foreground" />
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
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Vertical Separator - Edge to Edge */}
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
  )
}
