"use client"

import { useState, useCallback, useTransition } from "react"
import { Search, X, ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"
import type { MessageDTO } from "./types"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg",
      "animate-in fade-in slide-in-from-right-2 duration-200",
      className
    )}>
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={locale === "ar" ? "بحث في الرسائل..." : "Search messages..."}
          className="pl-8 pr-4 h-8 text-sm"
          autoFocus
        />
        {isSearching && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results counter & navigation */}
      {results.length > 0 && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
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
        <span className="text-xs text-muted-foreground">
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
