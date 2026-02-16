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

import { submitAssignment } from "./contribution-actions"

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

const ASSIGNMENT_TYPES = [
  { value: "homework", label: "Homework" },
  { value: "project", label: "Project" },
  { value: "lab", label: "Lab" },
  { value: "essay", label: "Essay" },
  { value: "presentation", label: "Presentation" },
  { value: "research", label: "Research" },
  { value: "group-work", label: "Group Work" },
  { value: "other", label: "Other" },
] as const

// ============================================================================
// Component
// ============================================================================

export function ContributeAssignmentForm({ catalogSubjects }: Props) {
  const [isPending, startTransition] = useTransition()

  // Subject cascade
  const [subjectId, setSubjectId] = useState("")
  const [chapterId, setChapterId] = useState("")
  const [lessonId, setLessonId] = useState("")

  // Assignment fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [rubric, setRubric] = useState("")
  const [totalPoints, setTotalPoints] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [assignmentType, setAssignmentType] = useState("homework")
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
    setInstructions("")
    setRubric("")
    setTotalPoints("")
    setEstimatedTime("")
    setAssignmentType("homework")
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

    const parsedPoints = totalPoints ? parseFloat(totalPoints) : undefined
    if (
      parsedPoints !== undefined &&
      (Number.isNaN(parsedPoints) || parsedPoints <= 0)
    ) {
      toast.error("Total points must be a positive number")
      return
    }

    const parsedTime = estimatedTime ? parseInt(estimatedTime, 10) : undefined
    if (
      parsedTime !== undefined &&
      (Number.isNaN(parsedTime) || parsedTime <= 0)
    ) {
      toast.error("Estimated time must be a positive number")
      return
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    startTransition(async () => {
      try {
        const result = await submitAssignment({
          catalogSubjectId: subjectId,
          catalogChapterId: chapterId || null,
          catalogLessonId: lessonId || null,
          title: title.trim(),
          description: description.trim() || undefined,
          instructions: instructions.trim() || undefined,
          rubric: rubric.trim() || undefined,
          totalPoints: parsedPoints,
          estimatedTime: parsedTime,
          assignmentType,
          tags,
        })

        if (result.success) {
          toast.success("Assignment submitted for review")
          resetForm()
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to submit assignment"
        )
      }
    })
  }, [
    subjectId,
    chapterId,
    lessonId,
    title,
    description,
    instructions,
    rubric,
    totalPoints,
    estimatedTime,
    assignmentType,
    tagsInput,
    resetForm,
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribute an Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject / Chapter / Lesson Cascade */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="a-subject">Subject *</Label>
            <Select value={subjectId} onValueChange={handleSubjectChange}>
              <SelectTrigger id="a-subject">
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
            <Label htmlFor="a-chapter">Chapter</Label>
            <Select
              value={chapterId}
              onValueChange={handleChapterChange}
              disabled={chapters.length === 0}
            >
              <SelectTrigger id="a-chapter">
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
            <Label htmlFor="a-lesson">Lesson</Label>
            <Select
              value={lessonId}
              onValueChange={setLessonId}
              disabled={lessons.length === 0}
            >
              <SelectTrigger id="a-lesson">
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
          <Label htmlFor="a-title">Title *</Label>
          <Input
            id="a-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="a-description">Description</Label>
          <Textarea
            id="a-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this assignment..."
            rows={3}
          />
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <Label htmlFor="a-instructions">Instructions</Label>
          <Textarea
            id="a-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Detailed instructions for students..."
            rows={4}
          />
        </div>

        {/* Rubric */}
        <div className="space-y-2">
          <Label htmlFor="a-rubric">Grading Rubric</Label>
          <Textarea
            id="a-rubric"
            value={rubric}
            onChange={(e) => setRubric(e.target.value)}
            placeholder="Describe grading criteria..."
            rows={4}
          />
        </div>

        {/* Type / Points / Estimated Time */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="a-type">Assignment Type</Label>
            <Select value={assignmentType} onValueChange={setAssignmentType}>
              <SelectTrigger id="a-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_TYPES.map((at) => (
                  <SelectItem key={at.value} value={at.value}>
                    {at.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="a-points">Total Points</Label>
            <Input
              id="a-points"
              type="number"
              min={1}
              step={1}
              value={totalPoints}
              onChange={(e) => setTotalPoints(e.target.value)}
              placeholder="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="a-time">
              Estimated Time{" "}
              <span className="text-muted-foreground text-xs">(minutes)</span>
            </Label>
            <Input
              id="a-time"
              type="number"
              min={1}
              step={5}
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="60"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="a-tags">
            Tags{" "}
            <span className="text-muted-foreground text-xs">
              (comma-separated)
            </span>
          </Label>
          <Input
            id="a-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="homework, algebra, grade-10"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Submitting..." : "Submit Assignment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
