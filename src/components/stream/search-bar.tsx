"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Search as SearchIcon, X } from "lucide-react"
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

const exploreRoles = [
  { title: "Data Analyst", href: "/courses?role=data-analyst" },
  { title: "Project Manager", href: "/courses?role=project-manager" },
  { title: "Cyber Security Analyst", href: "/courses?role=cyber-security" },
  { title: "Data Scientist", href: "/courses?role=data-scientist" },
  { title: "Business Intelligence Analyst", href: "/courses?role=bi-analyst" },
  { title: "Digital Marketing Specialist", href: "/courses?role=digital-marketing" },
  { title: "UI / UX Designer", href: "/courses?role=ui-ux" },
  { title: "Machine Learning Engineer", href: "/courses?role=ml-engineer" },
]

const exploreCategories = [
  { title: "Artificial Intelligence", href: "/courses?category=ai" },
  { title: "Business", href: "/courses?category=business" },
  { title: "Data Science", href: "/courses?category=data-science" },
  { title: "Information Technology", href: "/courses?category=it" },
  { title: "Computer Science", href: "/courses?category=cs" },
  { title: "Healthcare", href: "/courses?category=healthcare" },
  { title: "Physical Science and Engineering", href: "/courses?category=engineering" },
  { title: "Personal Development", href: "/courses?category=personal-dev" },
  { title: "Social Sciences", href: "/courses?category=social-sciences" },
  { title: "Language Learning", href: "/courses?category=languages" },
]

const certificates = [
  { title: "Business", href: "/certificates?field=business" },
  { title: "Computer Science", href: "/certificates?field=cs" },
  { title: "Data Science", href: "/certificates?field=data-science" },
  { title: "Information Technology", href: "/certificates?field=it" },
]

const degrees = [
  { title: "Bachelor's Degrees", href: "/degrees?level=bachelors" },
  { title: "Master's Degrees", href: "/degrees?level=masters" },
  { title: "Postgraduate Programs", href: "/degrees?level=postgraduate" },
]

const trendingSkills = [
  { title: "Python", href: "/courses?skill=python" },
  { title: "Artificial Intelligence", href: "/courses?skill=ai" },
  { title: "Excel", href: "/courses?skill=excel" },
  { title: "Machine Learning", href: "/courses?skill=ml" },
  { title: "SQL", href: "/courses?skill=sql" },
  { title: "Project Management", href: "/courses?skill=project-management" },
  { title: "Power BI", href: "/courses?skill=power-bi" },
  { title: "Marketing", href: "/courses?skill=marketing" },
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

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative w-full", className)}
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
                <div className={cn(
                  "grid gap-8 p-8 w-[52rem] lg:w-[58rem] grid-cols-4",
                  isRTL && "direction-rtl"
                )}>
                  {/* Column 1: Explore roles */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">
                      {dictionary?.explore?.roles || "Explore roles"}
                    </h4>
                    <ul className="space-y-2">
                      {exploreRoles.map((role) => (
                        <li key={role.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={`/${lang}/stream${role.href}`}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {role.title}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                      <li>
                        <Link
                          href={`/${lang}/stream/courses`}
                          className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                        >
                          {dictionary?.explore?.viewAll || "View all"}
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: Explore categories */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">
                      {dictionary?.explore?.categories || "Explore categories"}
                    </h4>
                    <ul className="space-y-2">
                      {exploreCategories.map((category) => (
                        <li key={category.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={`/${lang}/stream${category.href}`}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {category.title}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                      <li>
                        <Link
                          href={`/${lang}/stream/courses`}
                          className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                        >
                          {dictionary?.explore?.viewAll || "View all"}
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Column 3: Certificates & Degrees */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">
                        {dictionary?.explore?.certificates || "Earn a Professional Certificate"}
                      </h4>
                      <ul className="space-y-2">
                        {certificates.map((cert) => (
                          <li key={cert.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={`/${lang}/stream${cert.href}`}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {cert.title}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                        <li>
                          <Link
                            href={`/${lang}/stream/certificates`}
                            className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                          >
                            {dictionary?.explore?.viewAll || "View all"}
                          </Link>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">
                        {dictionary?.explore?.degrees || "Earn an online degree"}
                      </h4>
                      <ul className="space-y-2">
                        {degrees.map((degree) => (
                          <li key={degree.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={`/${lang}/stream${degree.href}`}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {degree.title}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                        <li>
                          <Link
                            href={`/${lang}/stream/degrees`}
                            className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                          >
                            {dictionary?.explore?.viewAll || "View all"}
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Column 4: Trending skills */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">
                        {dictionary?.explore?.trending || "Explore trending skills"}
                      </h4>
                      <ul className="space-y-2">
                        {trendingSkills.map((skill) => (
                          <li key={skill.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={`/${lang}/stream${skill.href}`}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {skill.title}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">
                        {dictionary?.explore?.certification || "Prepare for a certification exam"}
                      </h4>
                      <Link
                        href={`/${lang}/stream/certifications`}
                        className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                      >
                        {dictionary?.explore?.viewAll || "View all"}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t px-8 py-5 bg-muted/30 rounded-b-2xl">
                  <p className="text-sm text-muted-foreground">
                    {dictionary?.explore?.notSure || "Not sure where to begin?"}{" "}
                    <Link
                      href={`/${lang}/stream/courses?filter=free`}
                      className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                    >
                      {dictionary?.explore?.browseFree || "Browse free courses"}
                    </Link>
                  </p>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Vertical Separator */}
        <div className={cn(
          "h-6 w-px bg-border",
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
