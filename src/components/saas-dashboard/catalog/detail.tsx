"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState, useTransition } from "react"
import Link from "next/link"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  GripVertical,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Video,
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
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { CatalogImageUpload } from "@/components/saas-dashboard/catalog/image-upload"
import { createLessonVideo } from "@/components/saas-dashboard/catalog/video-actions"
import { LessonVideoManager } from "@/components/saas-dashboard/catalog/video-manager"
import { Shell as PageContainer } from "@/components/table/shell"

import {
  createCatalogChapter,
  createCatalogLesson,
  deleteCatalogChapter,
  deleteCatalogLesson,
  reorderCatalogChapters,
  reorderCatalogLessons,
  updateCatalogChapter,
  updateCatalogLesson,
  updateCatalogSubject,
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
  _count?: { videos: number }
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
  curriculum: string
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
  const { dictionary } = useDictionary()
  const t = dictionary?.messages?.toast
  const [chapters, setChapters] = useState<Chapter[]>(subject.chapters)
  const [isPending, startTransition] = useTransition()

  // Local state for hero display (updates immediately after edit)
  const [heroDisplay, setHeroDisplay] = useState({
    name: subject.name,
    description: subject.description,
    color: subject.color,
    levels: subject.levels,
    department: subject.department,
  })

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
  const [lessonVideoUrl, setLessonVideoUrl] = useState("")
  const [lessonVideoTitle, setLessonVideoTitle] = useState("")

  // Video dialog state
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [videoLessonId, setVideoLessonId] = useState<string | null>(null)
  const [videoLessonName, setVideoLessonName] = useState("")

  // Subject edit dialog state
  const [isSubjectEditOpen, setIsSubjectEditOpen] = useState(false)
  const [subjectName, setSubjectName] = useState(subject.name)
  const [subjectSlug, setSubjectSlug] = useState(subject.slug)
  const [subjectDepartment, setSubjectDepartment] = useState(subject.department)
  const [subjectDescription, setSubjectDescription] = useState(
    subject.description ?? ""
  )
  const [subjectColor, setSubjectColor] = useState(subject.color ?? "#f3f4f6")
  const [subjectCountry, setSubjectCountry] = useState(subject.country)
  const [subjectCurriculum, setSubjectCurriculum] = useState(subject.curriculum)
  const [subjectLevels, setSubjectLevels] = useState<string[]>(subject.levels)
  const [subjectStatus, setSubjectStatus] = useState(subject.status)

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ==========================================
  // SUBJECT EDIT HANDLER
  // ==========================================

  const handleEditSubject = () => {
    setSubjectName(subject.name)
    setSubjectSlug(subject.slug)
    setSubjectDepartment(subject.department)
    setSubjectDescription(subject.description ?? "")
    setSubjectColor(subject.color ?? "#f3f4f6")
    setSubjectCountry(subject.country)
    setSubjectCurriculum(subject.curriculum)
    setSubjectLevels(subject.levels)
    setSubjectStatus(subject.status)
    setIsSubjectEditOpen(true)
  }

  const handleSaveSubject = () => {
    if (!subjectName.trim()) {
      toast.error("Subject name is required")
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("name", subjectName.trim())
        formData.set("slug", subjectSlug)
        formData.set("department", subjectDepartment)
        formData.set("description", subjectDescription)
        formData.set("color", subjectColor)
        formData.set("country", subjectCountry)
        formData.set("curriculum", subjectCurriculum)
        formData.set("status", subjectStatus)
        for (const level of subjectLevels) {
          formData.append("levels", level)
        }

        const result = await updateCatalogSubject(subject.id, formData)
        if (!result.success) {
          toast.error("Failed to update subject")
          return
        }

        setHeroDisplay({
          name: subjectName.trim(),
          description: subjectDescription || null,
          color: subjectColor,
          levels: subjectLevels,
          department: subjectDepartment,
        })
        toast.success(t?.success?.updated || "Subject updated")
        setIsSubjectEditOpen(false)
      } catch {
        toast.error("Failed to update subject")
      }
    })
  }

  function toggleSubjectLevel(level: string) {
    setSubjectLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  // ==========================================
  // REORDER HANDLERS
  // ==========================================

  const handleReorderChapters = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setChapters((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id)
        const newIndex = prev.findIndex((c) => c.id === over.id)
        const reordered = arrayMove(prev, oldIndex, newIndex)
        const withPositions = reordered.map((ch, i) => ({
          ...ch,
          sequenceOrder: i,
        }))

        // Persist to server
        startTransition(async () => {
          try {
            await reorderCatalogChapters(
              subject.id,
              withPositions.map((c) => ({
                id: c.id,
                position: c.sequenceOrder,
              }))
            )
          } catch {
            toast.error("Failed to save order")
          }
        })

        return withPositions
      })
    },
    [subject.id]
  )

  const handleReorderLessons = useCallback(
    (chapterId: string, event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setChapters((prev) =>
        prev.map((ch) => {
          if (ch.id !== chapterId) return ch
          const oldIndex = ch.lessons.findIndex((l) => l.id === active.id)
          const newIndex = ch.lessons.findIndex((l) => l.id === over.id)
          const reordered = arrayMove(ch.lessons, oldIndex, newIndex)
          const withPositions = reordered.map((l, i) => ({
            ...l,
            sequenceOrder: i,
          }))

          // Persist to server
          startTransition(async () => {
            try {
              await reorderCatalogLessons(
                chapterId,
                withPositions.map((l) => ({
                  id: l.id,
                  position: l.sequenceOrder,
                }))
              )
            } catch {
              toast.error("Failed to save order")
            }
          })

          return { ...ch, lessons: withPositions }
        })
      )
    },
    []
  )

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
      toast.error(
        dictionary?.common?.failedToSave || "Chapter name is required"
      )
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
            toast.error(t?.error?.updateFailed || "Failed to update chapter")
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
          toast.success(t?.success?.updated || "Chapter updated")
        } else {
          formData.set("subjectId", subject.id)
          const result = await createCatalogChapter(formData)
          if (!result.success) {
            toast.error(t?.error?.createFailed || "Failed to create chapter")
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
          toast.success(t?.success?.created || "Chapter created")
        }

        setIsChapterDialogOpen(false)
      } catch {
        toast.error(t?.error?.saveFailed || "Failed to save chapter")
      }
    })
  }

  const handleDeleteChapter = (chapterId: string) => {
    startTransition(async () => {
      try {
        await deleteCatalogChapter(chapterId)
        setChapters((prev) => prev.filter((c) => c.id !== chapterId))
        toast.success(t?.success?.deleted || "Chapter deleted")
      } catch {
        toast.error(t?.error?.deleteFailed || "Failed to delete chapter")
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
    setLessonVideoUrl("")
    setLessonVideoTitle("")
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
    setLessonVideoUrl("")
    setLessonVideoTitle("")
    setIsLessonDialogOpen(true)
  }

  const handleSaveLesson = () => {
    if (!lessonName.trim()) {
      toast.error(dictionary?.common?.failedToSave || "Lesson name is required")
      return
    }
    if (!selectedChapterId) {
      toast.error(dictionary?.common?.failedToSave || "Chapter not selected")
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
            toast.error(t?.error?.updateFailed || "Failed to update lesson")
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
          toast.success(t?.success?.updated || "Lesson updated")
        } else {
          formData.set("chapterId", selectedChapterId)
          const result = await createCatalogLesson(formData)
          if (!result.success) {
            toast.error(t?.error?.createFailed || "Failed to create lesson")
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
          // Create inline video if URL provided
          if (lessonVideoUrl.trim()) {
            try {
              await createLessonVideo({
                catalogLessonId: result.lesson.id,
                title: lessonVideoTitle.trim() || lessonName.trim(),
                videoUrl: lessonVideoUrl.trim(),
              })
            } catch {
              toast.error("Lesson created but video failed to save")
            }
          }

          toast.success(t?.success?.created || "Lesson created")
        }

        // For edited lessons, also create video if URL provided
        if (editingLesson && lessonVideoUrl.trim()) {
          try {
            await createLessonVideo({
              catalogLessonId: editingLesson.id,
              title: lessonVideoTitle.trim() || lessonName.trim(),
              videoUrl: lessonVideoUrl.trim(),
            })
            toast.success("Video added")
          } catch {
            toast.error("Lesson updated but video failed to save")
          }
        }

        setIsLessonDialogOpen(false)
      } catch {
        toast.error(t?.error?.saveFailed || "Failed to save lesson")
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
        toast.success(t?.success?.deleted || "Lesson deleted")
      } catch {
        toast.error(t?.error?.deleteFailed || "Failed to delete lesson")
      }
    })
  }

  // ==========================================
  // VIDEO HANDLER
  // ==========================================

  const handleManageVideos = (lesson: Lesson) => {
    setVideoLessonId(lesson.id)
    setVideoLessonName(lesson.name)
    setIsVideoDialogOpen(true)
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
        <span className="text-foreground">{heroDisplay.name}</span>
      </nav>

      {/* Hero */}
      <div
        className="mb-6 rounded-lg p-6"
        style={{ backgroundColor: heroDisplay.color ?? "#f3f4f6" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              {heroDisplay.name}
            </h1>
            {heroDisplay.description && (
              <p className="text-sm text-white/80">{heroDisplay.description}</p>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white hover:bg-white/30"
            onClick={handleEditSubject}
          >
            <Pencil className="me-2 size-3.5" />
            Edit Subject
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          {heroDisplay.levels.map((level) => (
            <Badge
              key={level}
              variant="secondary"
              className="bg-white/20 text-white"
            >
              {level}
            </Badge>
          ))}
          <Badge variant="secondary" className="bg-white/20 text-white">
            {heroDisplay.department}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleReorderChapters}
          >
            <SortableContext
              items={chapters.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {chapters.map((chapter) => (
                  <SortableChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    isPending={isPending}
                    sensors={sensors}
                    onEditChapter={handleEditChapter}
                    onDeleteChapter={handleDeleteChapter}
                    onCreateLesson={handleCreateLesson}
                    onEditLesson={handleEditLesson}
                    onDeleteLesson={handleDeleteLesson}
                    onManageVideos={handleManageVideos}
                    onReorderLessons={handleReorderLessons}
                  />
                ))}
                {chapters.length === 0 && (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No chapters yet. Click &quot;Add Chapter&quot; to build the
                    curriculum structure.
                  </p>
                )}
              </div>
            </SortableContext>
          </DndContext>
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

            {/* Inline Video */}
            <div className="space-y-2 rounded-md border p-3">
              <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Quick Add Video (optional)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="lesson-video-title" className="text-xs">
                    Video Title
                  </Label>
                  <Input
                    id="lesson-video-title"
                    value={lessonVideoTitle}
                    onChange={(e) => setLessonVideoTitle(e.target.value)}
                    placeholder="Video title (or uses lesson name)"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lesson-video-url" className="text-xs">
                    Video URL
                  </Label>
                  <Input
                    id="lesson-video-url"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>
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

      {/* Video Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Videos</DialogTitle>
            <DialogDescription>
              Upload or link videos for this lesson. Platform videos are visible
              to all schools by default.
            </DialogDescription>
          </DialogHeader>
          {videoLessonId && (
            <LessonVideoManager
              lessonId={videoLessonId}
              lessonName={videoLessonName}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Subject Edit Dialog */}
      <Dialog open={isSubjectEditOpen} onOpenChange={setIsSubjectEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject details for the global catalog.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
            <div className="space-y-2">
              <Label htmlFor="es-name">Name *</Label>
              <Input
                id="es-name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-slug">Slug</Label>
              <Input
                id="es-slug"
                value={subjectSlug}
                onChange={(e) => setSubjectSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-department">Department *</Label>
              <Input
                id="es-department"
                value={subjectDepartment}
                onChange={(e) => setSubjectDepartment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-description">Description</Label>
              <Textarea
                id="es-description"
                value={subjectDescription}
                onChange={(e) => setSubjectDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="es-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="es-color"
                    value={subjectColor}
                    onChange={(e) => setSubjectColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border"
                  />
                  <Input
                    value={subjectColor}
                    onChange={(e) => setSubjectColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={subjectStatus} onValueChange={setSubjectStatus}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="es-country">Country</Label>
                <Input
                  id="es-country"
                  value={subjectCountry}
                  onChange={(e) => setSubjectCountry(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="es-curriculum">Curriculum</Label>
                <Input
                  id="es-curriculum"
                  value={subjectCurriculum}
                  onChange={(e) => setSubjectCurriculum(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Levels *</Label>
              <div className="flex gap-2">
                {(["ELEMENTARY", "MIDDLE", "HIGH"] as const).map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={
                      subjectLevels.includes(level) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleSubjectLevel(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubjectEditOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSubject} disabled={isPending}>
              {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

// ---------------------------------------------------------------------------
// Sortable Chapter Item (with drag-and-drop)
// ---------------------------------------------------------------------------

interface SortableChapterItemProps {
  chapter: Chapter
  isPending: boolean
  sensors: ReturnType<typeof useSensors>
  onEditChapter: (chapter: Chapter) => void
  onDeleteChapter: (id: string) => void
  onCreateLesson: (chapterId: string) => void
  onEditLesson: (lesson: Lesson, chapterId: string) => void
  onDeleteLesson: (lessonId: string, chapterId: string) => void
  onManageVideos: (lesson: Lesson) => void
  onReorderLessons: (chapterId: string, event: DragEndEvent) => void
}

function SortableChapterItem({
  chapter,
  isPending,
  sensors,
  onEditChapter,
  onDeleteChapter,
  onCreateLesson,
  onEditLesson,
  onDeleteLesson,
  onManageVideos,
  onReorderLessons,
}: SortableChapterItemProps) {
  const [open, setOpen] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2">
          <button
            {...attributes}
            {...listeners}
            className="hover:bg-muted-foreground/10 cursor-grab rounded p-0.5 active:cursor-grabbing"
            type="button"
          >
            <GripVertical className="text-muted-foreground h-4 w-4" />
          </button>
          <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-sm">
            {open ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">{chapter.name}</span>
            <Badge variant="outline" className="ms-auto text-xs">
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
                    This will delete the chapter and all its lessons. This
                    action cannot be undone.
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
          <div className="ms-6 space-y-0.5 border-s py-1 ps-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => onReorderLessons(chapter.id, e)}
            >
              <SortableContext
                items={chapter.lessons.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {chapter.lessons.map((lesson) => (
                  <SortableLessonItem
                    key={lesson.id}
                    lesson={lesson}
                    chapterId={chapter.id}
                    isPending={isPending}
                    onEditLesson={onEditLesson}
                    onDeleteLesson={onDeleteLesson}
                    onManageVideos={onManageVideos}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {chapter.lessons.length === 0 && (
              <p className="text-muted-foreground py-2 text-xs">
                No lessons yet
              </p>
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sortable Lesson Item
// ---------------------------------------------------------------------------

interface SortableLessonItemProps {
  lesson: Lesson
  chapterId: string
  isPending: boolean
  onEditLesson: (lesson: Lesson, chapterId: string) => void
  onDeleteLesson: (lessonId: string, chapterId: string) => void
  onManageVideos: (lesson: Lesson) => void
}

function SortableLessonItem({
  lesson,
  chapterId,
  isPending,
  onEditLesson,
  onDeleteLesson,
  onManageVideos,
}: SortableLessonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="text-muted-foreground group flex items-center gap-2 py-1 text-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="hover:bg-muted-foreground/10 cursor-grab rounded p-0.5 active:cursor-grabbing"
        type="button"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <BookOpen className="h-3.5 w-3.5 shrink-0" />
      <span>{lesson.name}</span>
      {lesson.durationMinutes && (
        <span className="text-xs">{lesson.durationMinutes} min</span>
      )}
      <Badge
        variant={lesson.status === "PUBLISHED" ? "default" : "secondary"}
        className="ms-auto text-xs"
      >
        {lesson.status}
      </Badge>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-6 w-6"
          onClick={() => onManageVideos(lesson)}
          disabled={isPending}
          title="Manage videos"
        >
          <Video className="size-3" />
          {(lesson._count?.videos ?? 0) > 0 && (
            <span className="bg-primary text-primary-foreground absolute -end-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold">
              {lesson._count!.videos}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onEditLesson(lesson, chapterId)}
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
                This will permanently delete this lesson. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDeleteLesson(lesson.id, chapterId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
