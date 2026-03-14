"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"

interface SubjectSummary {
  id: string
  name: string
  totalQuestions: number
  easyCount: number
  mediumCount: number
  hardCount: number
}

interface PracticeQuestion {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  bloomLevel: string
  points: number
  options: Record<string, unknown> | null
  subjectId: string
}

interface PracticeSessionProps {
  subjects: SubjectSummary[]
  questions: PracticeQuestion[]
  lang: Locale
}

type PracticeMode = "browse" | "session" | "results"

interface Answer {
  questionId: string
  selectedOptionId?: string
  answerText?: string
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function PracticeSession({
  subjects,
  questions,
  lang,
}: PracticeSessionProps) {
  const [mode, setMode] = useState<PracticeMode>("browse")
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL")
  const [questionCount, setQuestionCount] = useState(10)
  const [sessionQuestions, setSessionQuestions] = useState<PracticeQuestion[]>(
    []
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map())
  const [showAnswer, setShowAnswer] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const isAr = lang === "ar"

  // Filter questions by subject and difficulty
  const availableQuestions = useMemo(() => {
    let filtered = questions
    if (selectedSubject) {
      filtered = filtered.filter((q) => q.subjectId === selectedSubject)
    }
    if (selectedDifficulty !== "ALL") {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty)
    }
    return filtered
  }, [questions, selectedSubject, selectedDifficulty])

  const startPractice = useCallback(() => {
    const count = Math.min(questionCount, availableQuestions.length)
    if (count === 0) return
    const shuffled = shuffleArray(availableQuestions).slice(0, count)
    setSessionQuestions(shuffled)
    setCurrentIndex(0)
    setAnswers(new Map())
    setShowAnswer(false)
    setCorrectCount(0)
    setMode("session")
  }, [availableQuestions, questionCount])

  const currentQuestion = sessionQuestions[currentIndex]

  const handleAnswer = useCallback(
    (questionId: string, answer: Partial<Answer>) => {
      setAnswers((prev) => {
        const next = new Map(prev)
        next.set(questionId, { questionId, ...answer })
        return next
      })
    },
    []
  )

  const checkAnswer = useCallback(
    (question: PracticeQuestion, answer: Answer | undefined): boolean => {
      if (!answer || !question.options) return false

      const opts = question.options as {
        options?: Array<{
          id: string
          text: string
          isCorrect?: boolean
        }>
        acceptedAnswers?: string[]
        correctAnswer?: string
      }

      if (
        question.questionType === "MULTIPLE_CHOICE" ||
        question.questionType === "TRUE_FALSE"
      ) {
        const correctOpt = opts.options?.find((o) => o.isCorrect)
        return correctOpt?.id === answer.selectedOptionId
      }

      if (question.questionType === "FILL_BLANK") {
        const accepted = opts.acceptedAnswers || []
        return accepted.some(
          (a) =>
            a.toLowerCase().trim() ===
            (answer.answerText || "").toLowerCase().trim()
        )
      }

      // Short answer, essay -- can't auto-check
      return false
    },
    []
  )

  const revealAnswer = useCallback(() => {
    if (!currentQuestion) return
    const answer = answers.get(currentQuestion.id)
    const isCorrect = checkAnswer(currentQuestion, answer)
    if (isCorrect && !showAnswer) {
      setCorrectCount((prev) => prev + 1)
    }
    setShowAnswer(true)
  }, [currentQuestion, answers, checkAnswer, showAnswer])

  const nextQuestion = useCallback(() => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setShowAnswer(false)
    } else {
      setMode("results")
    }
  }, [currentIndex, sessionQuestions.length])

  const prevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setShowAnswer(false)
    }
  }, [currentIndex])

  const restartPractice = useCallback(() => {
    setMode("browse")
    setSessionQuestions([])
    setAnswers(new Map())
    setCorrectCount(0)
  }, [])

  // Save practice result to localStorage when entering results mode
  useEffect(() => {
    if (mode !== "results" || sessionQuestions.length === 0) return

    const autoGradable = sessionQuestions.filter((q) =>
      ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"].includes(q.questionType)
    ).length
    const percentage =
      autoGradable > 0 ? Math.round((correctCount / autoGradable) * 100) : 0

    const subjectName =
      subjects.find((s) => s.id === selectedSubject)?.name || "Mixed"

    const entry = {
      id: Date.now().toString(),
      subjectName,
      totalQuestions: sessionQuestions.length,
      correctCount,
      autoGradable,
      percentage,
      difficulty: selectedDifficulty,
      completedAt: new Date().toISOString(),
    }

    try {
      const key = "hogwarts-practice-history"
      const existing = JSON.parse(localStorage.getItem(key) || "[]")
      existing.unshift(entry)
      // Keep last 50 entries
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)))
    } catch {
      // localStorage not available
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load practice history
  const [practiceHistory, setPracticeHistory] = useState<
    Array<{
      id: string
      subjectName: string
      totalQuestions: number
      correctCount: number
      percentage: number
      difficulty: string
      completedAt: string
    }>
  >([])

  useEffect(() => {
    try {
      const key = "hogwarts-practice-history"
      const data = JSON.parse(localStorage.getItem(key) || "[]")
      setPracticeHistory(data.slice(0, 10))
    } catch {
      // localStorage not available
    }
  }, [mode])

  // === BROWSE MODE: Subject cards + config ===
  if (mode === "browse") {
    return (
      <div className="space-y-6">
        {/* Subject cards */}
        <div>
          <h3 className="mb-3 font-semibold">
            {isAr ? "اختر المادة" : "Choose Subject"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((sub) => (
              <Card
                key={sub.id}
                className={`cursor-pointer transition-colors ${
                  selectedSubject === sub.id
                    ? "border-primary ring-primary/20 ring-2"
                    : "hover:border-muted-foreground/30"
                }`}
                onClick={() =>
                  setSelectedSubject(selectedSubject === sub.id ? null : sub.id)
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {sub.name}
                    </span>
                    {selectedSubject === sub.id && (
                      <Check className="text-primary h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-muted-foreground mb-2 text-sm">
                    {sub.totalQuestions} {isAr ? "سؤال" : "questions"}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="default" className="text-xs">
                      {isAr ? "سهل" : "Easy"} {sub.easyCount}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {isAr ? "متوسط" : "Medium"} {sub.mediumCount}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      {isAr ? "صعب" : "Hard"} {sub.hardCount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Practice config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              {isAr ? "إعدادات التدريب" : "Practice Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{isAr ? "مستوى الصعوبة" : "Difficulty Level"}</Label>
                <RadioGroup
                  value={selectedDifficulty}
                  onValueChange={setSelectedDifficulty}
                  className="mt-2 flex flex-wrap gap-2"
                >
                  {[
                    { value: "ALL", label: isAr ? "الكل" : "All" },
                    { value: "EASY", label: isAr ? "سهل" : "Easy" },
                    { value: "MEDIUM", label: isAr ? "متوسط" : "Medium" },
                    { value: "HARD", label: isAr ? "صعب" : "Hard" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center gap-1.5">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="count">
                  {isAr ? "عدد الأسئلة" : "Number of Questions"}
                </Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={Math.max(availableQuestions.length, 1)}
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="mt-2 w-24"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  {availableQuestions.length} {isAr ? "سؤال متاح" : "available"}
                </p>
              </div>
            </div>

            <Button
              onClick={startPractice}
              disabled={availableQuestions.length === 0}
              className="w-full sm:w-auto"
            >
              <Zap className="me-2 h-4 w-4" />
              {isAr ? "ابدأ التدريب" : "Start Practice"}
              {availableQuestions.length > 0 &&
                ` (${Math.min(questionCount, availableQuestions.length)})`}
            </Button>
          </CardContent>
        </Card>

        {/* Practice History */}
        {practiceHistory.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">
              {isAr ? "سجل التدريب" : "Practice History"}
            </h3>
            <div className="space-y-2">
              {practiceHistory.map((entry) => (
                <Card key={entry.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                          entry.percentage >= 70
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : entry.percentage >= 50
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        }`}
                      >
                        {entry.percentage}%
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {entry.subjectName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {entry.correctCount}/{entry.totalQuestions}{" "}
                          {isAr ? "صحيح" : "correct"} &middot;{" "}
                          {new Date(entry.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {entry.difficulty !== "ALL" && (
                      <Badge variant="outline" className="text-xs">
                        {entry.difficulty}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // === RESULTS MODE ===
  if (mode === "results") {
    const total = sessionQuestions.length
    const autoGradable = sessionQuestions.filter((q) =>
      ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"].includes(q.questionType)
    ).length
    const percentage =
      autoGradable > 0 ? Math.round((correctCount / autoGradable) * 100) : 0

    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center py-8">
            <Trophy className="text-primary mb-4 h-16 w-16" />
            <h2 className="mb-2 text-2xl font-bold">
              {isAr ? "أحسنت!" : "Well Done!"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isAr
                ? `أكملت ${total} سؤال`
                : `You completed ${total} questions`}
            </p>

            {autoGradable > 0 && (
              <div className="mb-4 w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {correctCount}/{autoGradable} {isAr ? "صحيح" : "correct"}
                  </span>
                  <span className="font-bold">{percentage}%</span>
                </div>
                <Progress value={percentage} />
              </div>
            )}

            {total > autoGradable && (
              <p className="text-muted-foreground mb-4 text-sm">
                {total - autoGradable}{" "}
                {isAr
                  ? "أسئلة مقالية (تحتاج مراجعة يدوية)"
                  : "essay/short answer questions (need manual review)"}
              </p>
            )}

            <div className="flex gap-3">
              <Button onClick={restartPractice} variant="outline">
                <RotateCcw className="me-2 h-4 w-4" />
                {isAr ? "تدريب جديد" : "New Practice"}
              </Button>
              <Button onClick={startPractice}>
                <Flame className="me-2 h-4 w-4" />
                {isAr ? "أعد المحاولة" : "Try Again"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // === SESSION MODE: Interactive practice ===
  if (!currentQuestion) return null

  const answer = answers.get(currentQuestion.id)
  const progress = ((currentIndex + 1) / sessionQuestions.length) * 100
  const isLastQuestion = currentIndex === sessionQuestions.length - 1

  const opts = currentQuestion.options as {
    options?: Array<{
      id: string
      text: string
      isCorrect?: boolean
    }>
    acceptedAnswers?: string[]
    sampleAnswer?: string
  } | null

  const isAutoGradable = [
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "FILL_BLANK",
  ].includes(currentQuestion.questionType)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {currentIndex + 1} / {sessionQuestions.length}
          </span>
          <Badge
            variant={
              currentQuestion.difficulty === "EASY"
                ? "default"
                : currentQuestion.difficulty === "MEDIUM"
                  ? "secondary"
                  : "destructive"
            }
          >
            {currentQuestion.difficulty}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={restartPractice}
          title={isAr ? "إنهاء" : "Exit"}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Question card */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-lg font-medium">{currentQuestion.questionText}</p>

          {/* MCQ / True-False */}
          {(currentQuestion.questionType === "MULTIPLE_CHOICE" ||
            currentQuestion.questionType === "TRUE_FALSE") &&
            opts?.options && (
              <RadioGroup
                value={answer?.selectedOptionId || ""}
                onValueChange={(val) =>
                  handleAnswer(currentQuestion.id, { selectedOptionId: val })
                }
                disabled={showAnswer}
              >
                {opts.options.map((opt) => {
                  let optClass = ""
                  if (showAnswer) {
                    if (opt.isCorrect) optClass = "border-green-500 bg-green-50"
                    else if (answer?.selectedOptionId === opt.id)
                      optClass = "border-red-500 bg-red-50"
                  }
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 ${optClass}`}
                    >
                      <RadioGroupItem value={opt.id} id={opt.id} />
                      <Label htmlFor={opt.id} className="flex-1 cursor-pointer">
                        {opt.text}
                      </Label>
                      {showAnswer && opt.isCorrect && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  )
                })}
              </RadioGroup>
            )}

          {/* Fill in the blank */}
          {currentQuestion.questionType === "FILL_BLANK" && (
            <div>
              <Input
                placeholder={isAr ? "اكتب إجابتك" : "Type your answer"}
                value={answer?.answerText || ""}
                onChange={(e) =>
                  handleAnswer(currentQuestion.id, {
                    answerText: e.target.value,
                  })
                }
                disabled={showAnswer}
              />
              {showAnswer && opts?.acceptedAnswers && (
                <p className="mt-2 text-sm text-green-600">
                  {isAr ? "الإجابات المقبولة:" : "Accepted answers:"}{" "}
                  {opts.acceptedAnswers.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Short answer / Essay */}
          {(currentQuestion.questionType === "SHORT_ANSWER" ||
            currentQuestion.questionType === "ESSAY") && (
            <div>
              <Textarea
                placeholder={isAr ? "اكتب إجابتك" : "Write your answer"}
                value={answer?.answerText || ""}
                onChange={(e) =>
                  handleAnswer(currentQuestion.id, {
                    answerText: e.target.value,
                  })
                }
                disabled={showAnswer}
                rows={currentQuestion.questionType === "ESSAY" ? 6 : 3}
              />
              {showAnswer && opts?.sampleAnswer && (
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="mb-1 text-xs font-medium text-green-700">
                    {isAr ? "الإجابة النموذجية:" : "Sample Answer:"}
                  </p>
                  <p className="text-sm text-green-800">{opts.sampleAnswer}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevQuestion}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="me-1 h-4 w-4" />
          {isAr ? "السابق" : "Previous"}
        </Button>

        <div className="flex gap-2">
          {!showAnswer && (
            <Button variant="secondary" onClick={revealAnswer}>
              {isAr ? "تحقق من الإجابة" : "Check Answer"}
            </Button>
          )}

          <Button onClick={nextQuestion}>
            {isLastQuestion
              ? isAr
                ? "إنهاء"
                : "Finish"
              : isAr
                ? "التالي"
                : "Next"}
            {!isLastQuestion && <ChevronRight className="ms-1 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
