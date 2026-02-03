/**
 * Mobile Grading Component
 *
 * Touch-optimized interface for quick grading on mobile devices:
 * - Swipe left/right for quick marking
 * - Tap to enter partial credit
 * - Gesture-based navigation
 * - Optimized for one-handed use
 */

"use client"

import * as React from "react"
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion"
import { Check, ChevronLeft, ChevronRight, Edit, Minus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

// Answer to grade
interface AnswerToGrade {
  id: string
  questionNumber: number
  questionText: string
  questionType: "MCQ" | "SHORT_ANSWER" | "ESSAY" | "TRUE_FALSE"
  maxPoints: number
  studentAnswer: string
  correctAnswer?: string
  aiSuggestedScore?: number
  currentScore?: number
  rubricCriteria?: Array<{
    criterion: string
    maxPoints: number
  }>
}

// Grading result
interface GradingResult {
  answerId: string
  score: number
  maxPoints: number
  feedback?: string
}

interface MobileGradingProps {
  answers: AnswerToGrade[]
  studentName: string
  examTitle: string
  onGrade: (result: GradingResult) => Promise<void>
  onComplete: () => void
  dictionary?: {
    grading?: {
      title?: string
      swipeRight?: string
      swipeLeft?: string
      tapToEdit?: string
      correct?: string
      incorrect?: string
      partial?: string
      progress?: string
      complete?: string
      skip?: string
      undo?: string
    }
  }
}

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 100

export function MobileGrading({
  answers,
  studentName,
  examTitle,
  onGrade,
  onComplete,
  dictionary,
}: MobileGradingProps) {
  const d = dictionary?.grading

  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [gradedResults, setGradedResults] = React.useState<
    Map<string, GradingResult>
  >(new Map())
  const [showPartialInput, setShowPartialInput] = React.useState(false)
  const [partialScore, setPartialScore] = React.useState("")
  const [isGrading, setIsGrading] = React.useState(false)

  // Motion values for swipe animation
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 1, 1, 1, 0.5]
  )

  // Background colors based on swipe direction
  const bgColor = useTransform(
    x,
    [-200, -50, 0, 50, 200],
    [
      "rgb(239, 68, 68)", // Red (wrong)
      "rgb(255, 255, 255)",
      "rgb(255, 255, 255)",
      "rgb(255, 255, 255)",
      "rgb(34, 197, 94)", // Green (correct)
    ]
  )

  const currentAnswer = answers[currentIndex]
  const progress = (gradedResults.size / answers.length) * 100
  const isComplete = gradedResults.size === answers.length

  // Handle swipe end
  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    const swipeDistance = info.offset.x

    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
      if (swipeDistance > 0) {
        // Swipe right = correct (full points)
        await gradeAnswer(currentAnswer.maxPoints)
      } else {
        // Swipe left = incorrect (0 points)
        await gradeAnswer(0)
      }
    }

    // Reset position
    x.set(0)
  }

  // Grade the current answer
  const gradeAnswer = async (score: number) => {
    if (isGrading || !currentAnswer) return

    setIsGrading(true)

    const result: GradingResult = {
      answerId: currentAnswer.id,
      score,
      maxPoints: currentAnswer.maxPoints,
    }

    try {
      await onGrade(result)

      // Update local state
      setGradedResults((prev) => new Map(prev).set(currentAnswer.id, result))

      // Move to next question
      if (currentIndex < answers.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      }
    } finally {
      setIsGrading(false)
      setShowPartialInput(false)
      setPartialScore("")
    }
  }

  // Handle partial score submission
  const handlePartialSubmit = () => {
    const score = parseFloat(partialScore)
    if (!isNaN(score) && score >= 0 && score <= currentAnswer.maxPoints) {
      gradeAnswer(score)
    }
  }

  // Navigate to previous/next
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < answers.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  // Undo last grade
  const undoLastGrade = () => {
    if (currentIndex > 0) {
      const prevAnswer = answers[currentIndex - 1]
      setGradedResults((prev) => {
        const newMap = new Map(prev)
        newMap.delete(prevAnswer.id)
        return newMap
      })
      setCurrentIndex((prev) => prev - 1)
    }
  }

  // Check if current answer is already graded
  const currentGrade = gradedResults.get(currentAnswer?.id ?? "")

  if (!currentAnswer) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">No answers to grade</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="font-semibold">{examTitle}</h2>
        <p className="text-muted-foreground text-sm">{studentName}</p>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs">
            <span>{d?.progress ?? "Progress"}</span>
            <span>
              {gradedResults.size} / {answers.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Swipe Instructions */}
      <div className="text-muted-foreground flex justify-between px-4 py-2 text-xs">
        <span className="flex items-center gap-1">
          <X className="h-3 w-3 text-red-500" />
          {d?.swipeLeft ?? "Swipe left: Wrong"}
        </span>
        <span className="flex items-center gap-1">
          {d?.swipeRight ?? "Swipe right: Correct"}
          <Check className="h-3 w-3 text-green-500" />
        </span>
      </div>

      {/* Main Card (Swipeable) */}
      <div className="relative flex-1 overflow-hidden px-4 py-2">
        <motion.div
          style={{ x, rotate, opacity, backgroundColor: bgColor }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="h-full cursor-grab active:cursor-grabbing"
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Q{currentAnswer.questionNumber}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{currentAnswer.questionType}</Badge>
                  <Badge variant="secondary">
                    {currentAnswer.maxPoints} pts
                  </Badge>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {currentAnswer.questionText}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student Answer */}
              <div>
                <h4 className="mb-1 text-sm font-medium">Student Answer:</h4>
                <div className="bg-muted rounded-md p-3 text-sm">
                  {currentAnswer.studentAnswer || (
                    <span className="text-muted-foreground italic">
                      No answer provided
                    </span>
                  )}
                </div>
              </div>

              {/* Correct Answer (if available) */}
              {currentAnswer.correctAnswer && (
                <div>
                  <h4 className="mb-1 text-sm font-medium">Correct Answer:</h4>
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-900/20">
                    {currentAnswer.correctAnswer}
                  </div>
                </div>
              )}

              {/* AI Suggested Score */}
              {currentAnswer.aiSuggestedScore !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI Suggested:</span>
                  <Badge>
                    {currentAnswer.aiSuggestedScore}/{currentAnswer.maxPoints}
                  </Badge>
                </div>
              )}

              {/* Current Grade (if already graded) */}
              {currentGrade && (
                <div className="flex items-center justify-between rounded-md bg-blue-50 p-2 text-sm dark:bg-blue-900/20">
                  <span className="font-medium">Graded:</span>
                  <Badge
                    variant={
                      currentGrade.score === currentGrade.maxPoints
                        ? "default"
                        : currentGrade.score === 0
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {currentGrade.score}/{currentGrade.maxPoints}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Swipe Indicators */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
          <div className="rounded-full bg-red-500/20 p-2">
            <X className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <div className="rounded-full bg-green-500/20 p-2">
            <Check className="h-6 w-6 text-green-500" />
          </div>
        </div>
      </div>

      {/* Partial Credit Input */}
      {showPartialInput ? (
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max={currentAnswer.maxPoints}
              step="0.5"
              value={partialScore}
              onChange={(e) => setPartialScore(e.target.value)}
              placeholder={`0 - ${currentAnswer.maxPoints}`}
              className="flex-1"
              autoFocus
            />
            <Button onClick={handlePartialSubmit} disabled={isGrading}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPartialInput(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Action Buttons */
        <div className="border-t p-4">
          <div className="grid grid-cols-4 gap-2">
            {/* Previous */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Wrong (0 points) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => gradeAnswer(0)}
              disabled={isGrading}
              className={cn(
                "border-red-200 text-red-600 hover:bg-red-50",
                "dark:border-red-800 dark:hover:bg-red-900/20"
              )}
            >
              <X className="mr-1 h-4 w-4" />0
            </Button>

            {/* Partial Credit */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPartialInput(true)}
              disabled={isGrading}
            >
              <Edit className="mr-1 h-4 w-4" />
              <Minus className="h-3 w-3" />
            </Button>

            {/* Correct (full points) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => gradeAnswer(currentAnswer.maxPoints)}
              disabled={isGrading}
              className={cn(
                "border-green-200 text-green-600 hover:bg-green-50",
                "dark:border-green-800 dark:hover:bg-green-900/20"
              )}
            >
              <Check className="mr-1 h-4 w-4" />
              {currentAnswer.maxPoints}
            </Button>
          </div>

          {/* Second Row */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {/* Undo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={undoLastGrade}
              disabled={currentIndex === 0 || isGrading}
            >
              {d?.undo ?? "Undo"}
            </Button>

            {/* Next / Complete */}
            {isComplete ? (
              <Button size="sm" onClick={onComplete}>
                {d?.complete ?? "Complete"}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                disabled={currentIndex === answers.length - 1}
              >
                {d?.skip ?? "Skip"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
