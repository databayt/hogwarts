"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * AI Question Generation Content
 * Form to generate questions with AI + review and save flow
 */
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { BloomLevel, DifficultyLevel, QuestionType } from "@prisma/client"
import {
  Check,
  CheckCircle,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  generateQuestionsAI,
  saveAIGeneratedQuestions,
} from "./actions/ai-generation"
import type { AIGeneratedQuestion } from "./types"

interface SubjectOption {
  label: string
  value: string
}

interface AIGenerateContentProps {
  subjects: SubjectOption[]
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True/False",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  FILL_BLANK: "Fill in the Blank",
}

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
}

const BLOOM_LABELS: Record<string, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
}

export function AIGenerateContent({ subjects }: AIGenerateContentProps) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.qbankUi?.aiGenerate
  // The question bank's own labels for the enums this form offers; the
  // English constants above stay as the fallback.
  const cfg = dictionary?.school?.exams?.qbankUi?.config
  const typeLabels: Record<string, string> = {
    MULTIPLE_CHOICE:
      cfg?.questionTypes?.mcq ?? QUESTION_TYPE_LABELS.MULTIPLE_CHOICE,
    TRUE_FALSE:
      cfg?.questionTypes?.trueFalse ?? QUESTION_TYPE_LABELS.TRUE_FALSE,
    SHORT_ANSWER:
      cfg?.questionTypes?.shortAnswer ?? QUESTION_TYPE_LABELS.SHORT_ANSWER,
    ESSAY: cfg?.questionTypes?.essay ?? QUESTION_TYPE_LABELS.ESSAY,
    FILL_BLANK:
      cfg?.questionTypes?.fillBlank ?? QUESTION_TYPE_LABELS.FILL_BLANK,
  }
  const difficultyLabels: Record<string, string> = {
    EASY: cfg?.difficulty?.easy ?? DIFFICULTY_LABELS.EASY,
    MEDIUM: cfg?.difficulty?.medium ?? DIFFICULTY_LABELS.MEDIUM,
    HARD: cfg?.difficulty?.hard ?? DIFFICULTY_LABELS.HARD,
  }
  const bloomLabels: Record<string, string> = {
    REMEMBER: cfg?.bloomLevels?.remember ?? BLOOM_LABELS.REMEMBER,
    UNDERSTAND: cfg?.bloomLevels?.understand ?? BLOOM_LABELS.UNDERSTAND,
    APPLY: cfg?.bloomLevels?.apply ?? BLOOM_LABELS.APPLY,
    ANALYZE: cfg?.bloomLevels?.analyze ?? BLOOM_LABELS.ANALYZE,
    EVALUATE: cfg?.bloomLevels?.evaluate ?? BLOOM_LABELS.EVALUATE,
    CREATE: cfg?.bloomLevels?.create ?? BLOOM_LABELS.CREATE,
  }

  // Form state
  const [subjectId, setSubjectId] = useState("")
  const [topic, setTopic] = useState("")
  const [questionType, setQuestionType] = useState<string>("MULTIPLE_CHOICE")
  const [difficulty, setDifficulty] = useState<string>("MEDIUM")
  const [bloomLevel, setBloomLevel] = useState<string>("UNDERSTAND")
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [additionalInstructions, setAdditionalInstructions] = useState("")

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState<
    AIGeneratedQuestion[]
  >([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [savedCount, setSavedCount] = useState<number | null>(null)

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    setGeneratedQuestions([])
    setSelectedIndices(new Set())
    setSavedCount(null)

    const result = await generateQuestionsAI({
      subjectId,
      topic,
      questionType,
      difficulty,
      bloomLevel,
      numberOfQuestions,
      additionalInstructions: additionalInstructions || undefined,
      tags: [],
    })

    if (result.success && result.data) {
      setGeneratedQuestions(result.data)
      // Select all by default
      setSelectedIndices(new Set(result.data.map((_, i) => i)))
    } else if (!result.success) {
      setError(result.error || (t?.generateFailed ?? "Generation failed"))
    }

    setIsGenerating(false)
  }, [
    subjectId,
    topic,
    questionType,
    difficulty,
    bloomLevel,
    numberOfQuestions,
    additionalInstructions,
  ])

  const toggleSelection = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    const selected = generatedQuestions.filter((_, i) => selectedIndices.has(i))
    if (selected.length === 0) return

    setIsSaving(true)
    setError(null)

    const result = await saveAIGeneratedQuestions({
      subjectId,
      questions: selected,
    })

    if (result.success && result.data) {
      setSavedCount(result.data.savedCount)
    } else if (!result.success) {
      setError(result.error || (t?.saveFailed ?? "Failed to save"))
    }

    setIsSaving(false)
  }, [generatedQuestions, selectedIndices, subjectId])

  const canGenerate =
    subjectId && topic.length >= 3 && !isGenerating && !isSaving

  return (
    <div className="space-y-6">
      {/* Generation Form — phone: the grey card, white fields on it */}
      <Card className="max-md:bg-muted max-md:border-0">
        <CardHeader className="max-md:p-5 max-md:pb-3">
          <CardTitle className="flex items-center gap-2 max-md:text-base">
            <Sparkles className="h-5 w-5" />
            {dictionary?.school?.exams?.qbank?.aiGenerate ??
              "Generate Questions with AI"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-md:px-5 max-md:pb-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t?.subject ?? "Subject"}</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="max-md:bg-background">
                  <SelectValue
                    placeholder={t?.selectSubject ?? "Select subject"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t?.topic ?? "Topic"}</Label>
              <Input
                className="max-md:bg-background"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, Quadratic Equations"
              />
            </div>

            <div className="space-y-2">
              <Label>{t?.questionType ?? "Question Type"}</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger className="max-md:bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t?.difficulty ?? "Difficulty"}</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="max-md:bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(difficultyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t?.bloomLevel ?? "Bloom\u2019s Level"}</Label>
              <Select value={bloomLevel} onValueChange={setBloomLevel}>
                <SelectTrigger className="max-md:bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(bloomLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t?.numQuestions ?? "Number of Questions"}</Label>
              <Input
                className="max-md:bg-background"
                type="number"
                min={1}
                max={20}
                value={numberOfQuestions}
                onChange={(e) =>
                  setNumberOfQuestions(
                    Math.max(1, Math.min(20, Number(e.target.value)))
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              {t?.additionalInstructions ??
                "Additional Instructions (optional)"}
            </Label>
            <Textarea
              className="max-md:bg-background"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="e.g., Focus on practical applications, include diagrams description..."
              maxLength={500}
              rows={2}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="gap-2 max-md:h-10 max-md:w-full max-md:rounded-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {savedCount !== null && (
        <Card className="border-green-500">
          <CardContent className="flex items-center gap-2 pt-4 max-md:flex-wrap">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-sm font-medium">
              {savedCount} question{savedCount !== 1 ? "s" : ""} saved to
              Question Bank
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ms-auto"
              onClick={() => router.push("../qbank")}
            >
              View Question Bank
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Questions Review */}
      {generatedQuestions.length > 0 && savedCount === null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between max-md:flex-wrap max-md:gap-3">
            <h3 className="text-lg font-semibold">
              Review Generated Questions ({selectedIndices.size}/
              {generatedQuestions.length} selected)
            </h3>
            <Button
              onClick={handleSave}
              disabled={selectedIndices.size === 0 || isSaving}
              className="gap-2 max-md:h-10 max-md:rounded-full max-md:px-5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save {selectedIndices.size} Question
                  {selectedIndices.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>

          {generatedQuestions.map((q, idx) => (
            <Card
              key={idx}
              className={
                selectedIndices.has(idx)
                  ? "border-primary max-md:bg-muted"
                  : "max-md:bg-muted opacity-60 max-md:border-transparent"
              }
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {/* Selection toggle */}
                  <button
                    onClick={() => toggleSelection(idx)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      selectedIndices.has(idx)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedIndices.has(idx) && <Check className="h-3 w-3" />}
                  </button>

                  <div className="flex-1 space-y-2">
                    {/* Question header */}
                    <div className="flex items-center gap-2 max-md:flex-wrap">
                      <span className="text-muted-foreground text-sm font-medium">
                        Q{idx + 1}
                      </span>
                      <Badge variant="secondary">
                        {typeLabels[q.questionType] ?? q.questionType}
                      </Badge>
                      <Badge variant="outline">
                        {difficultyLabels[q.difficulty] ?? q.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {q.points} pt{q.points !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {/* Question text */}
                    <p className="font-medium">{q.questionText}</p>

                    {/* Options for MCQ/TF */}
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1 ps-4">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 text-sm ${
                              opt.isCorrect
                                ? "font-medium text-green-700 dark:text-green-400"
                                : ""
                            }`}
                          >
                            {opt.isCorrect ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <X className="text-muted-foreground h-3.5 w-3.5" />
                            )}
                            <span>
                              {String.fromCharCode(65 + oi)}. {opt.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Accepted answers for fill blank */}
                    {q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Accepted:{" "}
                        </span>
                        {q.acceptedAnswers.join(", ")}
                      </p>
                    )}

                    {/* Sample answer */}
                    {q.sampleAnswer && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Sample answer:{" "}
                        </span>
                        <span>{q.sampleAnswer}</span>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-muted-foreground text-xs italic">
                        {q.explanation}
                      </p>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => toggleSelection(idx)}
                    className="text-muted-foreground hover:text-destructive"
                    title={selectedIndices.has(idx) ? "Deselect" : "Select"}
                  >
                    {selectedIndices.has(idx) ? (
                      <Trash2 className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
