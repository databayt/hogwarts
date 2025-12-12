"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search as SearchIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchProps {
  lang: string
  dictionary?: any
  className?: string
  variant?: "default" | "expanded"
}

export function Search({ lang, dictionary, className, variant = "default" }: SearchProps) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("")
      inputRef.current?.blur()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative flex items-center",
        variant === "expanded" ? "w-full max-w-2xl" : "w-full max-w-md",
        className
      )}
    >
      <div
        className={cn(
          "relative flex items-center w-full rounded-full border transition-all duration-200",
          isFocused
            ? "border-primary ring-2 ring-primary/20"
            : "border-input hover:border-muted-foreground/50",
          "bg-background"
        )}
      >
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={dictionary?.search?.placeholder || "What do you want to learn?"}
          className={cn(
            "border-0 bg-transparent shadow-none focus-visible:ring-0 h-11",
            isRTL ? "pr-4 pl-14" : "pl-4 pr-14",
            "rounded-full"
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
              isRTL ? "left-14" : "right-14"
            )}
            aria-label={dictionary?.search?.clear || "Clear search"}
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        )}

        {/* Search Button */}
        <Button
          type="submit"
          size="icon"
          className={cn(
            "absolute size-9 rounded-full bg-primary hover:bg-primary/90",
            isRTL ? "left-1" : "right-1"
          )}
          aria-label={dictionary?.search?.submit || "Search"}
        >
          <SearchIcon className="size-4" />
        </Button>
      </div>
    </form>
  )
}

// Compact search for mobile/smaller screens
export function SearchCompact({ lang, dictionary, className }: Omit<SearchProps, "variant">) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/${lang}/stream/courses?search=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
      setQuery("")
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn("rounded-full", className)}
        aria-label={dictionary?.search?.open || "Open search"}
      >
        <SearchIcon className="size-5" />
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "absolute inset-x-0 top-0 z-50 flex items-center gap-2 bg-background p-2 shadow-lg",
        className
      )}
    >
      <Input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={dictionary?.search?.placeholder || "What do you want to learn?"}
        className="flex-1 h-10 rounded-full"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false)
            setQuery("")
          }
        }}
      />
      <Button
        type="submit"
        size="icon"
        className="rounded-full bg-primary"
      >
        <SearchIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(false)
          setQuery("")
        }}
        className="rounded-full"
      >
        <X className="size-5" />
      </Button>
    </form>
  )
}
