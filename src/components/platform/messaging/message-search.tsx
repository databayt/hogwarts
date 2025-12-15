"use client"

import { useCallback, useState, useTransition } from "react"
import { ChevronDown, ChevronUp, Loader2, Search, X } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type { MessageDTO } from "./types"

interface MessageSearchProps {
  conversationId: string
  locale?: "ar" | "en"
  onResultClick?: (messageId: string) => void
  className?: string
}

export function MessageSearch({
  conversationId,
  locale = "en",
  onResultClick,
  className,
}: MessageSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MessageDTO[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Debounced search function
  const searchMessages = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setTotalCount(0)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/messages/search?conversationId=${conversationId}&q=${encodeURIComponent(searchQuery)}&limit=50`
      )
      if (response.ok) {
        const data = await response.json()
        setResults(data.messages || [])
        setTotalCount(data.total || 0)
        setCurrentIndex(0)
      }
    } catch (error) {
      console.error("Failed to search messages:", error)
    } finally {
      setIsSearching(false)
    }
  }, 300)

  const handleSearchChange = (value: string) => {
    setQuery(value)
    searchMessages(value)
  }

  const handlePrevResult = () => {
    if (results.length === 0) return
    const newIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
    onResultClick?.(results[newIndex].id)
  }

  const handleNextResult = () => {
    if (results.length === 0) return
    const newIndex = currentIndex === results.length - 1 ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
    onResultClick?.(results[newIndex].id)
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuery("")
    setResults([])
    setTotalCount(0)
    setCurrentIndex(0)
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn("h-8 w-8", className)}
        aria-label={locale === "ar" ? "بحث في الرسائل" : "Search messages"}
      >
        <Search className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2",
        "animate-in fade-in slide-in-from-right-2 duration-200",
        className
      )}
    >
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={
            locale === "ar" ? "بحث في الرسائل..." : "Search messages..."
          }
          className="h-8 pr-4 pl-8 text-sm"
          autoFocus
        />
        {isSearching && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin" />
        )}
      </div>

      {/* Results counter & navigation */}
      {results.length > 0 && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="px-2 py-0.5 text-xs">
            {currentIndex + 1}/{results.length}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevResult}
            className="h-7 w-7"
            aria-label={locale === "ar" ? "النتيجة السابقة" : "Previous result"}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextResult}
            className="h-7 w-7"
            aria-label={locale === "ar" ? "النتيجة التالية" : "Next result"}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* No results message */}
      {query && !isSearching && results.length === 0 && (
        <span className="text-muted-foreground text-xs">
          {locale === "ar" ? "لا توجد نتائج" : "No results"}
        </span>
      )}

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="h-7 w-7"
        aria-label={locale === "ar" ? "إغلاق" : "Close"}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
