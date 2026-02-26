"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import { BookOpen, Check, Search, Star } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Locale } from "@/components/internationalization/config"

import { deselectCatalogBook, selectCatalogBook } from "./actions"

interface CatalogBook {
  id: string
  title: string
  slug: string
  author: string
  genre: string
  isbn: string | null
  description: string | null
  coverUrl: string | null
  coverColor: string
  rating: number
  ratingCount: number
  pageCount: number | null
  usageCount: number
  tags: string[]
  isSelected: boolean
}

interface Selection {
  id: string
  catalogBookId: string
  totalCopies: number
  shelfLocation: string | null
  isActive: boolean
}

interface Props {
  books: CatalogBook[]
  selections: Selection[]
  lang: Locale
  canManage?: boolean
}

export function BookPicker({
  books,
  selections,
  lang,
  canManage = false,
}: Props) {
  const isRTL = lang === "ar"
  const [search, setSearch] = useState("")
  const [genreFilter, setGenreFilter] = useState<string>("all")
  const [isPending, startTransition] = useTransition()
  const [optimisticSelected, setOptimisticSelected] = useState<Set<string>>(
    () => new Set(selections.map((s) => s.catalogBookId))
  )

  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addBookId, setAddBookId] = useState<string | null>(null)
  const [copies, setCopies] = useState("1")
  const [shelf, setShelf] = useState("")

  const t = {
    search: isRTL ? "بحث في الكتب..." : "Search books...",
    allGenres: isRTL ? "كل الأنواع" : "All Genres",
    selected: isRTL ? "في المكتبة" : "In Library",
    add: isRTL ? "إضافة" : "Add",
    remove: isRTL ? "إزالة" : "Remove",
    noResults: isRTL ? "لا توجد نتائج" : "No books found",
    description: isRTL
      ? "اختر الكتب من الكتالوج العالمي لإضافتها إلى مكتبة مدرستك"
      : "Select books from the global catalog to add to your school library",
    addToLibrary: isRTL ? "إضافة إلى المكتبة" : "Add to Library",
    copies: isRTL ? "عدد النسخ" : "Number of Copies",
    shelfLocation: isRTL ? "موقع الرف" : "Shelf Location",
    schools: isRTL ? "مدارس" : "schools",
  }

  const genres = useMemo(() => {
    const set = new Set(books.map((b) => b.genre))
    return Array.from(set).sort()
  }, [books])

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
      const matchesGenre = genreFilter === "all" || b.genre === genreFilter
      return matchesSearch && matchesGenre
    })
  }, [books, search, genreFilter])

  // Group by genre
  const groupedBooks = useMemo(() => {
    const groups: Record<string, CatalogBook[]> = {}
    for (const b of filteredBooks) {
      if (!groups[b.genre]) groups[b.genre] = []
      groups[b.genre].push(b)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredBooks])

  function handleToggle(bookId: string) {
    if (optimisticSelected.has(bookId)) {
      // Remove
      const newSet = new Set(optimisticSelected)
      newSet.delete(bookId)
      setOptimisticSelected(newSet)

      startTransition(async () => {
        const result = await deselectCatalogBook(bookId)
        if (!result.success) {
          // Revert
          setOptimisticSelected((prev) => new Set([...prev, bookId]))
          toast.error(result.error || "Failed to remove book")
        } else {
          toast.success("Book removed from library")
        }
      })
    } else {
      // Open add dialog
      setAddBookId(bookId)
      setCopies("1")
      setShelf("")
      setAddDialogOpen(true)
    }
  }

  function handleConfirmAdd() {
    if (!addBookId) return

    const newSet = new Set(optimisticSelected)
    newSet.add(addBookId)
    setOptimisticSelected(newSet)
    setAddDialogOpen(false)

    const bookId = addBookId
    const totalCopies = Math.max(1, Number(copies) || 1)
    const shelfLocation = shelf.trim() || undefined

    startTransition(async () => {
      const result = await selectCatalogBook(bookId, totalCopies, shelfLocation)
      if (!result.success) {
        setOptimisticSelected((prev) => {
          const s = new Set(prev)
          s.delete(bookId)
          return s
        })
        toast.error(result.error || "Failed to add book")
      } else {
        toast.success("Book added to library")
      }
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">{t.description}</p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t.allGenres} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allGenres}</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Book Grid by Genre */}
      {groupedBooks.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {t.noResults}
        </p>
      ) : (
        groupedBooks.map(([genre, genreBooks]) => (
          <div key={genre}>
            <h3 className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
              {genre}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {genreBooks.map((book) => {
                const selected = optimisticSelected.has(book.id)
                return (
                  <Card
                    key={book.id}
                    className={cn(
                      "group relative overflow-hidden transition-all hover:shadow-md",
                      canManage && "cursor-pointer",
                      selected && "ring-primary ring-2"
                    )}
                    onClick={
                      canManage ? () => handleToggle(book.id) : undefined
                    }
                  >
                    <div
                      className="relative h-24"
                      style={{ backgroundColor: book.coverColor }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {selected && (
                        <div className="bg-primary absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="absolute start-2 bottom-2">
                        <Badge
                          variant="secondary"
                          className="bg-white/20 text-[10px] text-white"
                        >
                          {book.genre}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="truncate font-medium">{book.title}</h4>
                      <p className="text-muted-foreground truncate text-xs">
                        {book.author}
                      </p>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                        {book.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {book.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {book.usageCount} {t.schools}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addToLibrary}</DialogTitle>
            <DialogDescription>
              {isRTL
                ? "حدد عدد النسخ وموقع الرف"
                : "Specify the number of copies and shelf location"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.copies}</Label>
              <Input
                type="number"
                min={1}
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.shelfLocation}</Label>
              <Input
                placeholder={isRTL ? "مثال: الرف أ-3" : "e.g., Shelf A-3"}
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleConfirmAdd} disabled={isPending}>
              {t.addToLibrary}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
