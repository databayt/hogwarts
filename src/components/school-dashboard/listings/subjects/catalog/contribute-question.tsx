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

import { submitQuestion } from "./contribution-actions"

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

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "ESSAY", label: "Essay" },
  { value: "FILL_BLANK", label: "Fill in the Blank" },
] as const

const DIFFICULTY_LEVELS = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
] as const

const BLOOM_LEVELS = [
  { value: "REMEMBER", label: "Remember" },
  { value: "UNDERSTAND", label: "Understand" },
  { value: "APPLY", label: "Apply" },
  { value: "ANALYZE", label: "Analyze" },
  { value: "EVALUATE", label: "Evaluate" },
  { value: "CREATE", label: "Create" },
] as const

type QuestionType = (typeof QUESTION_TYPES)[number]["value"]
type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]["value"]
type BloomLevel = (typeof BLOOM_LEVELS)[number]["value"]

// ============================================================================
// Component
// ============================================================================

export function ContributeQuestionForm({ catalogSubjects }: Props) {
  const [isPending, startTransition] = useTransition()

  // Subject cascade
  const [subjectId, setSubjectId] = useState("")
  const [chapterId, setChapterId] = useState("")
  const [lessonId, setLessonId] = useState("")

  // Question fields
  const [questionText, setQuestionText] = useState("")
  const [questionType, setQuestionType] =
    useState<QuestionType>("MULTIPLE_CHOICE")
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("MEDIUM")
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>("REMEMBER")
  const [points, setPoints] = useState("1")
  const [optionsJson, setOptionsJson] = useState("")
  const [sampleAnswer, setSampleAnswer] = useState("")
  const [explanation, setExplanation] = useState("")
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
    setQuestionText("")
    setQuestionType("MULTIPLE_CHOICE")
    setDifficulty("MEDIUM")
    setBloomLevel("REMEMBER")
    setPoints("1")
    setOptionsJson("")
    setSampleAnswer("")
    setExplanation("")
    setTagsInput("")
  }, [])

  const handleSubmit = useCallback(() => {
    if (!subjectId) {
      toast.error("Please select a subject")
      return
    }
    if (!questionText.trim()) {
      toast.error("Please enter the question text")
      return
    }

    const parsedPoints = parseFloat(points)
    if (Number.isNaN(parsedPoints) || parsedPoints <= 0) {
      toast.error("Points must be a positive number")
      return
    }

    let parsedOptions: unknown = undefined
    if (optionsJson.trim()) {
      try {
        parsedOptions = JSON.parse(optionsJson)
      } catch {
        toast.error("Options must be valid JSON")
        return
      }
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    startTransition(async () => {
      try {
        const result = await submitQuestion({
          catalogSubjectId: subjectId,
          catalogChapterId: chapterId || null,
          catalogLessonId: lessonId || null,
          questionText: questionText.trim(),
          questionType,
          difficulty,
          bloomLevel,
          points: parsedPoints,
          options: parsedOptions,
          sampleAnswer: sampleAnswer.trim() || undefined,
          explanation: explanation.trim() || undefined,
          tags,
        })

        if (result.success) {
          toast.success("Question submitted for review")
          resetForm()
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to submit question"
        )
      }
    })
  }, [
    subjectId,
    chapterId,
    lessonId,
    questionText,
    questionType,
    difficulty,
    bloomLevel,
    points,
    optionsJson,
    sampleAnswer,
    explanation,
    tagsInput,
    resetForm,
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribute a Question</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject / Chapter / Lesson Cascade */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="q-subject">Subject *</Label>
            <Select value={subjectId} onValueChange={handleSubjectChange}>
              <SelectTrigger id="q-subject">
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
            <Label htmlFor="q-chapter">Chapter</Label>
            <Select
              value={chapterId}
              onValueChange={handleChapterChange}
              disabled={chapters.length === 0}
            >
              <SelectTrigger id="q-chapter">
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
            <Label htmlFor="q-lesson">Lesson</Label>
            <Select
              value={lessonId}
              onValueChange={setLessonId}
              disabled={lessons.length === 0}
            >
              <SelectTrigger id="q-lesson">
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

        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="q-text">Question Text *</Label>
          <Textarea
            id="q-text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter the question text..."
            rows={4}
          />
        </div>

        {/* Type / Difficulty / Bloom / Points */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="q-type">Question Type *</Label>
            <Select
              value={questionType}
              onValueChange={(v) => setQuestionType(v as QuestionType)}
            >
              <SelectTrigger id="q-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((qt) => (
                  <SelectItem key={qt.value} value={qt.value}>
                    {qt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-difficulty">Difficulty *</Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as DifficultyLevel)}
            >
              <SelectTrigger id="q-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-bloom">Bloom Level *</Label>
            <Select
              value={bloomLevel}
              onValueChange={(v) => setBloomLevel(v as BloomLevel)}
            >
              <SelectTrigger id="q-bloom">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOOM_LEVELS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-points">Points *</Label>
            <Input
              id="q-points"
              type="number"
              min={0.25}
              step={0.25}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
        </div>

        {/* Options (JSON) — shown for MCQ / Fill Blank */}
        {(questionType === "MULTIPLE_CHOICE" ||
          questionType === "FILL_BLANK") && (
          <div className="space-y-2">
            <Label htmlFor="q-options">
              Options (JSON){" "}
              <span className="text-muted-foreground text-xs">
                e.g. [{"{"}&quot;label&quot;: &quot;A&quot;, &quot;text&quot;:
                &quot;Option A&quot;, &quot;isCorrect&quot;: true{"}"}]
              </span>
            </Label>
            <Textarea
              id="q-options"
              value={optionsJson}
              onChange={(e) => setOptionsJson(e.target.value)}
              placeholder='[{"label": "A", "text": "...", "isCorrect": false}]'
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        )}

        {/* Sample Answer */}
        <div className="space-y-2">
          <Label htmlFor="q-answer">Sample Answer</Label>
          <Textarea
            id="q-answer"
            value={sampleAnswer}
            onChange={(e) => setSampleAnswer(e.target.value)}
            placeholder="Provide a model answer..."
            rows={3}
          />
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <Label htmlFor="q-explanation">Explanation</Label>
          <Textarea
            id="q-explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explain why the correct answer is correct..."
            rows={3}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="q-tags">
            Tags{" "}
            <span className="text-muted-foreground text-xs">
              (comma-separated)
            </span>
          </Label>
          <Input
            id="q-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="algebra, equations, grade-10"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Submitting..." : "Submit Question"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
