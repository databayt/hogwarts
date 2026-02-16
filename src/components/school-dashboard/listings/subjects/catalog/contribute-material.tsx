"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { submitMaterial } from "./contribution-actions"

// ============================================================================
// Types
// ============================================================================

interface CatalogLesson {
  id: string
  name: string
}

interface CatalogChapter {
  id: string
  name: string
  lessons: CatalogLesson[]
}

interface CatalogSubjectOption {
  id: string
  name: string
  chapters: CatalogChapter[]
}

interface Props {
  catalogSubjects: CatalogSubjectOption[]
}

// ============================================================================
// Constants
// ============================================================================

const MATERIAL_TYPES = [
  { value: "TEXTBOOK", label: "Textbook" },
  { value: "SYLLABUS", label: "Syllabus" },
  { value: "WORKSHEET", label: "Worksheet" },
  { value: "STUDY_GUIDE", label: "Study Guide" },
  { value: "REFERENCE", label: "Reference" },
  { value: "VIDEO_GUIDE", label: "Video Guide" },
  { value: "LAB_MANUAL", label: "Lab Manual" },
  { value: "OTHER", label: "Other" },
] as const

type MaterialTypeValue = (typeof MATERIAL_TYPES)[number]["value"]

// ============================================================================
// Component
// ============================================================================

export function ContributeMaterialForm({ catalogSubjects }: Props) {
  const [isPending, startTransition] = useTransition()

  // Subject cascade
  const [subjectId, setSubjectId] = useState("")
  const [chapterId, setChapterId] = useState("")
  const [lessonId, setLessonId] = useState("")

  // Material fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [materialType, setMaterialType] = useState<MaterialTypeValue>("OTHER")
  const [externalUrl, setExternalUrl] = useState("")
  const [tagsInput, setTagsInput] = useState("")

  // Derived cascade data
  const selectedSubject = useMemo(
    () => catalogSubjects.find((s) => s.id === subjectId),
    [catalogSubjects, subjectId]
  )

  const chapters = useMemo(
    () => selectedSubject?.chapters ?? [],
    [selectedSubject]
  )

  const selectedChapter = useMemo(
    () => chapters.find((c) => c.id === chapterId),
    [chapters, chapterId]
  )

  const lessons = useMemo(
    () => selectedChapter?.lessons ?? [],
    [selectedChapter]
  )

  // Cascade reset handlers
  const handleSubjectChange = useCallback((value: string) => {
    setSubjectId(value)
    setChapterId("")
    setLessonId("")
  }, [])

  const handleChapterChange = useCallback((value: string) => {
    setChapterId(value)
    setLessonId("")
  }, [])

  const resetForm = useCallback(() => {
    setSubjectId("")
    setChapterId("")
    setLessonId("")
    setTitle("")
    setDescription("")
    setMaterialType("OTHER")
    setExternalUrl("")
    setTagsInput("")
  }, [])

  const handleSubmit = useCallback(() => {
    if (!subjectId) {
      toast.error("Please select a subject")
      return
    }
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    startTransition(async () => {
      try {
        const result = await submitMaterial({
          catalogSubjectId: subjectId,
          catalogChapterId: chapterId || null,
          catalogLessonId: lessonId || null,
          title: title.trim(),
          description: description.trim() || undefined,
          type: materialType,
          externalUrl: externalUrl.trim() || undefined,
          tags,
        })

        if (result.success) {
          toast.success("Material submitted for review")
          resetForm()
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to submit material"
        )
      }
    })
  }, [
    subjectId,
    chapterId,
    lessonId,
    title,
    description,
    materialType,
    externalUrl,
    tagsInput,
    resetForm,
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribute a Material</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject / Chapter / Lesson Cascade */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="m-subject">Subject *</Label>
            <Select value={subjectId} onValueChange={handleSubjectChange}>
              <SelectTrigger id="m-subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {catalogSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-chapter">Chapter</Label>
            <Select
              value={chapterId}
              onValueChange={handleChapterChange}
              disabled={chapters.length === 0}
            >
              <SelectTrigger id="m-chapter">
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-lesson">Lesson</Label>
            <Select
              value={lessonId}
              onValueChange={setLessonId}
              disabled={lessons.length === 0}
            >
              <SelectTrigger id="m-lesson">
                <SelectValue placeholder="Select lesson" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="m-title">Title *</Label>
          <Input
            id="m-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Material title"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="m-description">Description</Label>
          <Textarea
            id="m-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this material..."
            rows={3}
          />
        </div>

        {/* Type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="m-type">Material Type *</Label>
            <Select
              value={materialType}
              onValueChange={(v) => setMaterialType(v as MaterialTypeValue)}
            >
              <SelectTrigger id="m-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_TYPES.map((mt) => (
                  <SelectItem key={mt.value} value={mt.value}>
                    {mt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* External URL */}
          <div className="space-y-2">
            <Label htmlFor="m-url">External URL</Label>
            <Input
              id="m-url"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://example.com/resource"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="m-tags">
            Tags{" "}
            <span className="text-muted-foreground text-xs">
              (comma-separated)
            </span>
          </Label>
          <Input
            id="m-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="worksheet, algebra, grade-10"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Submitting..." : "Submit Material"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
