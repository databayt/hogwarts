"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { CatalogImageUpload } from "@/components/saas-dashboard/catalog/image-upload"
import { Shell as PageContainer } from "@/components/table/shell"

import {
  createCatalogChapter,
  createCatalogLesson,
  deleteCatalogChapter,
  deleteCatalogLesson,
  updateCatalogChapter,
  updateCatalogLesson,
} from "./actions"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Lesson {
  id: string
  name: string
  slug: string
  sequenceOrder: number
  status: string
  durationMinutes: number | null
  description: string | null
  objectives: string | null
}

interface Chapter {
  id: string
  name: string
  slug: string
  sequenceOrder: number
  status: string
  totalLessons: number
  description: string | null
  lessons: Lesson[]
}

interface Subject {
  id: string
  name: string
  slug: string
  department: string
  levels: string[]
  status: string
  country: string
  system: string
  description: string | null
  color: string | null
  imageKey: string | null
  thumbnailKey: string | null
  totalChapters: number
  totalLessons: number
  usageCount: number
  chapters: Chapter[]
}

interface Props {
  subject: Subject
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ARCHIVED",
  "DEPRECATED",
] as const

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatalogDetail({ subject, lang }: Props) {
  const [chapters, setChapters] = useState<Chapter[]>(subject.chapters)
  const [isPending, startTransition] = useTransition()

  // Chapter dialog state
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [chapterName, setChapterName] = useState("")
  const [chapterSlug, setChapterSlug] = useState("")
  const [chapterSlugManual, setChapterSlugManual] = useState(false)
  const [chapterDescription, setChapterDescription] = useState("")
  const [chapterSequence, setChapterSequence] = useState("")
  const [chapterStatus, setChapterStatus] = useState<string>("DRAFT")

  // Lesson dialog state
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  )
  const [lessonName, setLessonName] = useState("")
  const [lessonSlug, setLessonSlug] = useState("")
  const [lessonSlugManual, setLessonSlugManual] = useState(false)
  const [lessonDescription, setLessonDescription] = useState("")
  const [lessonSequence, setLessonSequence] = useState("")
  const [lessonDuration, setLessonDuration] = useState("")
  const [lessonObjectives, setLessonObjectives] = useState("")
  const [lessonStatus, setLessonStatus] = useState<string>("DRAFT")

  // ==========================================
  // CHAPTER HANDLERS
  // ==========================================

  const handleCreateChapter = () => {
    setEditingChapter(null)
    setChapterName("")
    setChapterSlug("")
    setChapterSlugManual(false)
    setChapterDescription("")
    setChapterSequence(String(chapters.length))
    setChapterStatus("DRAFT")
    setIsChapterDialogOpen(true)
  }

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setChapterName(chapter.name)
    setChapterSlug(chapter.slug)
    setChapterSlugManual(true)
    setChapterDescription(chapter.description ?? "")
    setChapterSequence(String(chapter.sequenceOrder))
    setChapterStatus(chapter.status)
    setIsChapterDialogOpen(true)
  }

  const handleSaveChapter = () => {
    if (!chapterName.trim()) {
      toast.error("Chapter name is required")
      return
    }

    const slug = chapterSlug || slugify(chapterName)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("name", chapterName.trim())
        formData.set("slug", slug)
        formData.set("description", chapterDescription)
        formData.set("sequenceOrder", chapterSequence || "0")
        formData.set("status", chapterStatus)

        if (editingChapter) {
          const result = await updateCatalogChapter(editingChapter.id, formData)
          if (!result.success) {
            toast.error("Failed to update chapter")
            return
          }
          setChapters((prev) =>
            prev.map((c) =>
              c.id === editingChapter.id
                ? {
                    ...c,
                    name: chapterName.trim(),
                    slug,
                    description: chapterDescription || null,
                    sequenceOrder: Number(chapterSequence) || 0,
                    status: chapterStatus,
                  }
                : c
            )
          )
          toast.success("Chapter updated")
        } else {
          formData.set("subjectId", subject.id)
          const result = await createCatalogChapter(formData)
          if (!result.success) {
            toast.error("Failed to create chapter")
            return
          }
          setChapters((prev) => [
            ...prev,
            {
              id: result.chapter.id,
              name: chapterName.trim(),
              slug,
              description: chapterDescription || null,
              sequenceOrder: Number(chapterSequence) || 0,
              status: chapterStatus,
              totalLessons: 0,
              lessons: [],
            },
          ])
          toast.success("Chapter created")
        }

        setIsChapterDialogOpen(false)
      } catch {
        toast.error("Failed to save chapter")
      }
    })
  }

  const handleDeleteChapter = (chapterId: string) => {
    startTransition(async () => {
      try {
        await deleteCatalogChapter(chapterId)
        setChapters((prev) => prev.filter((c) => c.id !== chapterId))
        toast.success("Chapter deleted")
      } catch {
        toast.error("Failed to delete chapter")
      }
    })
  }

  // ==========================================
  // LESSON HANDLERS
  // ==========================================

  const handleCreateLesson = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId)
    setSelectedChapterId(chapterId)
    setEditingLesson(null)
    setLessonName("")
    setLessonSlug("")
    setLessonSlugManual(false)
    setLessonDescription("")
    setLessonSequence(String(chapter?.lessons.length ?? 0))
    setLessonDuration("")
    setLessonObjectives("")
    setLessonStatus("DRAFT")
    setIsLessonDialogOpen(true)
  }

  const handleEditLesson = (lesson: Lesson, chapterId: string) => {
    setSelectedChapterId(chapterId)
    setEditingLesson(lesson)
    setLessonName(lesson.name)
    setLessonSlug(lesson.slug)
    setLessonSlugManual(true)
    setLessonDescription(lesson.description ?? "")
    setLessonSequence(String(lesson.sequenceOrder))
    setLessonDuration(
      lesson.durationMinutes ? String(lesson.durationMinutes) : ""
    )
    setLessonObjectives(lesson.objectives ?? "")
    setLessonStatus(lesson.status)
    setIsLessonDialogOpen(true)
  }

  const handleSaveLesson = () => {
    if (!lessonName.trim()) {
      toast.error("Lesson name is required")
      return
    }
    if (!selectedChapterId) {
      toast.error("Chapter not selected")
      return
    }

    const slug = lessonSlug || slugify(lessonName)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("name", lessonName.trim())
        formData.set("slug", slug)
        formData.set("description", lessonDescription)
        formData.set("sequenceOrder", lessonSequence || "0")
        if (lessonDuration) formData.set("durationMinutes", lessonDuration)
        formData.set("objectives", lessonObjectives)
        formData.set("status", lessonStatus)

        if (editingLesson) {
          const result = await updateCatalogLesson(editingLesson.id, formData)
          if (!result.success) {
            toast.error("Failed to update lesson")
            return
          }
          setChapters((prev) =>
            prev.map((c) =>
              c.id === selectedChapterId
                ? {
                    ...c,
                    lessons: c.lessons.map((l) =>
                      l.id === editingLesson.id
                        ? {
                            ...l,
                            name: lessonName.trim(),
                            slug,
                            description: lessonDescription || null,
                            sequenceOrder: Number(lessonSequence) || 0,
                            durationMinutes: lessonDuration
                              ? Number(lessonDuration)
                              : null,
                            objectives: lessonObjectives || null,
                            status: lessonStatus,
                          }
                        : l
                    ),
                  }
                : c
            )
          )
          toast.success("Lesson updated")
        } else {
          formData.set("chapterId", selectedChapterId)
          const result = await createCatalogLesson(formData)
          if (!result.success) {
            toast.error("Failed to create lesson")
            return
          }
          setChapters((prev) =>
            prev.map((c) =>
              c.id === selectedChapterId
                ? {
                    ...c,
                    totalLessons: c.totalLessons + 1,
                    lessons: [
                      ...c.lessons,
                      {
                        id: result.lesson.id,
                        name: lessonName.trim(),
                        slug,
                        description: lessonDescription || null,
                        sequenceOrder: Number(lessonSequence) || 0,
                        durationMinutes: lessonDuration
                          ? Number(lessonDuration)
                          : null,
                        objectives: lessonObjectives || null,
                        status: lessonStatus,
                      },
                    ],
                  }
                : c
            )
          )
          toast.success("Lesson created")
        }

        setIsLessonDialogOpen(false)
      } catch {
        toast.error("Failed to save lesson")
      }
    })
  }

  const handleDeleteLesson = (lessonId: string, chapterId: string) => {
    startTransition(async () => {
      try {
        await deleteCatalogLesson(lessonId)
        setChapters((prev) =>
          prev.map((c) =>
            c.id === chapterId
              ? {
                  ...c,
                  totalLessons: Math.max(0, c.totalLessons - 1),
                  lessons: c.lessons.filter((l) => l.id !== lessonId),
                }
              : c
          )
        )
        toast.success("Lesson deleted")
      } catch {
        toast.error("Failed to delete lesson")
      }
    })
  }

  // ==========================================
  // Computed
  // ==========================================

  const totalLessons = chapters.reduce((s, ch) => s + ch.lessons.length, 0)

  return (
    <PageContainer>
      {/* Breadcrumb */}
      <nav className="text-muted-foreground mb-4 text-sm">
        <Link href={`/${lang}/catalog`} className="hover:underline">
          Catalog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{subject.name}</span>
      </nav>

      {/* Hero */}
      <div
        className="mb-6 rounded-lg p-6"
        style={{ backgroundColor: subject.color ?? "#f3f4f6" }}
      >
        <h1 className="mb-2 text-2xl font-bold text-white">{subject.name}</h1>
        {subject.description && (
          <p className="text-sm text-white/80">{subject.description}</p>
        )}
        <div className="mt-3 flex gap-2">
          {subject.levels.map((level) => (
            <Badge
              key={level}
              variant="secondary"
              className="bg-white/20 text-white"
            >
              {level}
            </Badge>
          ))}
          <Badge variant="secondary" className="bg-white/20 text-white">
            {subject.department}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
            <Layers className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{chapters.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons</CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLessons}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schools Using</CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subject.usageCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Thumbnail Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thumbnail</CardTitle>
          <CardDescription>
            Upload a high-quality image for this subject. Processed into WebP
            variants and served via CDN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CatalogImageUpload
            entityType="subject"
            entityId={subject.id}
            currentThumbnailKey={subject.thumbnailKey}
            currentImageKey={subject.imageKey}
          />
        </CardContent>
      </Card>

      {/* Chapter/Lesson Tree */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Curriculum Structure</CardTitle>
              <CardDescription>
                {chapters.length} chapters with {totalLessons} lessons
              </CardDescription>
            </div>
            <Button onClick={handleCreateChapter} disabled={isPending}>
              {isPending ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : (
                <Plus className="me-2 size-4" />
              )}
              Add Chapter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {chapters.map((chapter) => (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                isPending={isPending}
                onEditChapter={handleEditChapter}
                onDeleteChapter={handleDeleteChapter}
                onCreateLesson={handleCreateLesson}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handleDeleteLesson}
              />
            ))}
            {chapters.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No chapters yet. Click &quot;Add Chapter&quot; to build the
                curriculum structure.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chapter Dialog */}
      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingChapter ? "Edit Chapter" : "Add New Chapter"}
            </DialogTitle>
            <DialogDescription>
              {editingChapter
                ? "Update the chapter details below."
                : "Enter the details for a new chapter."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chapter-name">Name</Label>
              <Input
                id="chapter-name"
                value={chapterName}
                onChange={(e) => {
                  setChapterName(e.target.value)
                  if (!chapterSlugManual) {
                    setChapterSlug(slugify(e.target.value))
                  }
                }}
                placeholder="e.g., Introduction to Algebra"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-slug">Slug</Label>
              <Input
                id="chapter-slug"
                value={chapterSlug}
                onChange={(e) => {
                  setChapterSlug(e.target.value)
                  setChapterSlugManual(true)
                }}
                placeholder="auto-generated-from-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-description">
                Description (optional)
              </Label>
              <Textarea
                id="chapter-description"
                value={chapterDescription}
                onChange={(e) => setChapterDescription(e.target.value)}
                placeholder="Brief description of this chapter..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chapter-sequence">Sequence Order</Label>
                <Input
                  id="chapter-sequence"
                  type="number"
                  min={0}
                  value={chapterSequence}
                  onChange={(e) => setChapterSequence(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={chapterStatus} onValueChange={setChapterStatus}>
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
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChapterDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveChapter} disabled={isPending}>
              {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
              {editingChapter ? "Save Changes" : "Create Chapter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Edit Lesson" : "Add New Lesson"}
            </DialogTitle>
            <DialogDescription>
              {editingLesson
                ? "Update the lesson details below."
                : "Enter the details for a new lesson."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-name">Name</Label>
              <Input
                id="lesson-name"
                value={lessonName}
                onChange={(e) => {
                  setLessonName(e.target.value)
                  if (!lessonSlugManual) {
                    setLessonSlug(slugify(e.target.value))
                  }
                }}
                placeholder="e.g., Linear Equations"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-slug">Slug</Label>
              <Input
                id="lesson-slug"
                value={lessonSlug}
                onChange={(e) => {
                  setLessonSlug(e.target.value)
                  setLessonSlugManual(true)
                }}
                placeholder="auto-generated-from-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-description">Description (optional)</Label>
              <Textarea
                id="lesson-description"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="What this lesson covers..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-sequence">Sequence</Label>
                <Input
                  id="lesson-sequence"
                  type="number"
                  min={0}
                  value={lessonSequence}
                  onChange={(e) => setLessonSequence(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Duration (min)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  min={0}
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  placeholder="45"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={lessonStatus} onValueChange={setLessonStatus}>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-objectives">Objectives (optional)</Label>
              <Textarea
                id="lesson-objectives"
                value={lessonObjectives}
                onChange={(e) => setLessonObjectives(e.target.value)}
                placeholder="Learning objectives for this lesson..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLessonDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLesson} disabled={isPending}>
              {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
              {editingLesson ? "Save Changes" : "Create Lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

// ---------------------------------------------------------------------------
// Chapter Item
// ---------------------------------------------------------------------------

interface ChapterItemProps {
  chapter: Chapter
  isPending: boolean
  onEditChapter: (chapter: Chapter) => void
  onDeleteChapter: (id: string) => void
  onCreateLesson: (chapterId: string) => void
  onEditLesson: (lesson: Lesson, chapterId: string) => void
  onDeleteLesson: (lessonId: string, chapterId: string) => void
}

function ChapterItem({
  chapter,
  isPending,
  onEditChapter,
  onDeleteChapter,
  onCreateLesson,
  onEditLesson,
  onDeleteLesson,
}: ChapterItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-sm">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{chapter.name}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {chapter.lessons.length} lessons
          </Badge>
          <Badge
            variant={chapter.status === "PUBLISHED" ? "default" : "secondary"}
            className="text-xs"
          >
            {chapter.status}
          </Badge>
        </CollapsibleTrigger>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onEditChapter(chapter)
            }}
            disabled={isPending}
          >
            <Pencil className="size-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
                disabled={isPending}
              >
                <Trash2 className="text-destructive size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete &quot;{chapter.name}&quot;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the chapter and all its lessons. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteChapter(chapter.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <CollapsibleContent>
        <div className="ml-6 space-y-0.5 border-l py-1 pl-4">
          {chapter.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="text-muted-foreground group flex items-center gap-2 py-1 text-sm"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>{lesson.name}</span>
              {lesson.durationMinutes && (
                <span className="text-xs">{lesson.durationMinutes} min</span>
              )}
              <Badge
                variant={
                  lesson.status === "PUBLISHED" ? "default" : "secondary"
                }
                className="ml-auto text-xs"
              >
                {lesson.status}
              </Badge>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onEditLesson(lesson, chapter.id)}
                  disabled={isPending}
                >
                  <Pencil className="size-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={isPending}
                    >
                      <Trash2 className="text-destructive size-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete &quot;{lesson.name}&quot;?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this lesson. This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteLesson(lesson.id, chapter.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {chapter.lessons.length === 0 && (
            <p className="text-muted-foreground py-2 text-xs">No lessons yet</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 text-xs"
            onClick={() => onCreateLesson(chapter.id)}
            disabled={isPending}
          >
            <Plus className="me-1 size-3" />
            Add Lesson
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
