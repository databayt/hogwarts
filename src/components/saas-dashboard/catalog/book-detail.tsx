"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import Link from "next/link"
import { BookOpen, GraduationCap, Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { Shell as PageContainer } from "@/components/table/shell"

import { deleteCatalogBook, updateCatalogBook } from "./book-actions"

interface CatalogBookDetail {
  id: string
  title: string
  slug: string
  lang: string
  author: string
  isbn: string | null
  genre: string
  description: string | null
  summary: string | null
  coverUrl: string | null
  coverColor: string
  publisher: string | null
  publicationYear: number | null
  language: string
  pageCount: number | null
  tags: string[]
  videoUrl: string | null
  rating: number
  ratingCount: number
  status: string
  approvalStatus: string
  visibility: string
  usageCount: number
  downloadCount: number
  _count: { schoolSelections: number; books: number }
}

interface Props {
  book: CatalogBookDetail
  lang: Locale
  dictionary?: Dictionary
}

const STATUS_OPTIONS = [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ARCHIVED",
  "DEPRECATED",
] as const

export function CatalogBookDetailView({ book, lang, dictionary }: Props) {
  const d = dictionary?.operator?.catalog
  const actions = dictionary?.operator?.common?.actions
  const [isPending, startTransition] = useTransition()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  // Edit form state
  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author)
  const [genre, setGenre] = useState(book.genre)
  const [isbn, setIsbn] = useState(book.isbn ?? "")
  const [description, setDescription] = useState(book.description ?? "")
  const [summary, setSummary] = useState(book.summary ?? "")
  const [publisher, setPublisher] = useState(book.publisher ?? "")
  const [pubYear, setPubYear] = useState(
    book.publicationYear ? String(book.publicationYear) : ""
  )
  const [pageCount, setPageCount] = useState(
    book.pageCount ? String(book.pageCount) : ""
  )
  const [status, setStatus] = useState(book.status)
  const [coverColor, setCoverColor] = useState(book.coverColor)

  function handleSave() {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("title", title.trim())
        formData.set("author", author.trim())
        formData.set("genre", genre.trim())
        if (isbn) formData.set("isbn", isbn.trim())
        if (description) formData.set("description", description)
        if (summary) formData.set("summary", summary)
        if (publisher) formData.set("publisher", publisher.trim())
        if (pubYear) formData.set("publicationYear", pubYear)
        if (pageCount) formData.set("pageCount", pageCount)
        formData.set("status", status)
        formData.set("coverColor", coverColor)

        const result = await updateCatalogBook(book.id, formData)
        if (!result.success) {
          toast.error(d?.failedToUpdate || "Failed to update book")
          return
        }
        toast.success(d?.bookUpdated || "Book updated")
        setIsEditOpen(false)
      } catch {
        toast.error(d?.failedToUpdate || "Failed to update book")
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCatalogBook(book.id)
        toast.success(d?.bookDeleted || "Book deleted")
        setIsDeleted(true)
      } catch {
        toast.error(d?.failedToDelete || "Failed to delete book")
      }
    })
  }

  if (isDeleted) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {d?.bookDeleted || "Book deleted"}.{" "}
            <Link href={`/${lang}/catalog/books`} className="underline">
              {d?.backToBooks || "Back to books"}
            </Link>
          </p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Breadcrumb */}
      <nav className="text-muted-foreground mb-4 text-sm">
        <Link href={`/${lang}/catalog/books`} className="hover:underline">
          {d?.books || "Books"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{book.title}</span>
      </nav>

      {/* Hero */}
      <div
        className="mb-6 rounded-lg p-6"
        style={{ backgroundColor: book.coverColor }}
      >
        <h1 className="mb-2 text-2xl font-bold text-white">{book.title}</h1>
        <p className="text-sm text-white/80">{book.author}</p>
        <div className="mt-3 flex gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white">
            {book.genre}
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {book.status}
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {book.approvalStatus}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.schoolsUsing || "Schools Using"}
            </CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{book._count.schoolSelections}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.schoolCopies || "School Copies"}
            </CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{book._count.books}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.rating || "Rating"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {book.rating.toFixed(1)} ({book.ratingCount})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{d?.bookDetails || "Book Details"}</CardTitle>
              <CardDescription>
                {d?.metadataDescription ||
                  "Metadata and description for this catalog book"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                disabled={isPending}
              >
                <Pencil className="me-2 size-4" />
                {actions?.edit || "Edit"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isPending}>
                    <Trash2 className="me-2 size-4" />
                    {actions?.delete || "Delete"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {(d?.deleteConfirmTitle || 'Delete "{title}"?').replace(
                        "{title}",
                        book.title
                      )}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {d?.deleteConfirmDescription ||
                        "This will permanently delete this catalog book and remove all school selections. This action cannot be undone."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {actions?.cancel || "Cancel"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {actions?.delete || "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">
                {d?.isbn || "ISBN"}
              </dt>
              <dd>{book.isbn || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {d?.publisher || "Publisher"}
              </dt>
              <dd>{book.publisher || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {d?.publicationYear || "Publication Year"}
              </dt>
              <dd>{book.publicationYear || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {d?.pageCount || "Page Count"}
              </dt>
              <dd>{book.pageCount || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {d?.language || "Language"}
              </dt>
              <dd>{book.language}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {d?.visibility || "Visibility"}
              </dt>
              <dd>{book.visibility}</dd>
            </div>
            {book.description && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-sm">
                  {d?.description || "Description"}
                </dt>
                <dd className="whitespace-pre-wrap">{book.description}</dd>
              </div>
            )}
            {book.summary && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-sm">
                  {d?.summary || "Summary"}
                </dt>
                <dd className="whitespace-pre-wrap">{book.summary}</dd>
              </div>
            )}
            {book.tags.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground mb-1 text-sm">
                  {d?.tags || "Tags"}
                </dt>
                <dd className="flex flex-wrap gap-1">
                  {book.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{d?.editBook || "Edit Book"}</DialogTitle>
            <DialogDescription>
              {d?.updateBookDescription || "Update the book details below."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{d?.title || "Title"}</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-author">{d?.author || "Author"}</Label>
              <Input
                id="edit-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-genre">{d?.genre || "Genre"}</Label>
              <Input
                id="edit-genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-isbn">{d?.isbn || "ISBN"}</Label>
              <Input
                id="edit-isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-publisher">
                {d?.publisher || "Publisher"}
              </Label>
              <Input
                id="edit-publisher"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pubyear">
                {d?.publicationYear || "Publication Year"}
              </Label>
              <Input
                id="edit-pubyear"
                type="number"
                value={pubYear}
                onChange={(e) => setPubYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pages">{d?.pageCount || "Page Count"}</Label>
              <Input
                id="edit-pages"
                type="number"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{d?.status || "Status"}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">
                {d?.coverColor || "Cover Color"}
              </Label>
              <Input
                id="edit-color"
                type="color"
                value={coverColor}
                onChange={(e) => setCoverColor(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-description">
                {d?.description || "Description"}
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-summary">{d?.summary || "Summary"}</Label>
              <Textarea
                id="edit-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {actions?.cancel || "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
              {d?.saveChanges || "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
