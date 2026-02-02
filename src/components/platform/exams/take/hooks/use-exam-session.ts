"use client"

/**
 * Hook for managing exam session state
 *
 * Handles:
 * - Session initialization
 * - Auto-save at intervals
 * - Answer state management
 * - Session resumption
 */
import { useCallback, useEffect, useRef, useState } from "react"

import {
  autoSaveAnswers,
  startExamSession,
  submitExamSession,
} from "../actions"
import type {
  AnswerState,
  ExamSessionData,
  SubmitAnswerPayload,
} from "../types"

interface UseExamSessionOptions {
  examId: string
  session: ExamSessionData | null
  initialAnswers?: Map<string, AnswerState>
  autoSaveInterval?: number // ms, default 30 seconds
  onSessionStart?: (session: ExamSessionData) => void
  onAutoSave?: () => void
  onSubmit?: () => void
  onError?: (error: string) => void
}

export function useExamSession({
  examId,
  session: initialSession,
  initialAnswers = new Map(),
  autoSaveInterval = 30000,
  onSessionStart,
  onAutoSave,
  onSubmit,
  onError,
}: UseExamSessionOptions) {
  const [session, setSession] = useState<ExamSessionData | null>(initialSession)
  const [answers, setAnswers] =
    useState<Map<string, AnswerState>>(initialAnswers)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const lastSaveTime = useRef<number>(Date.now())
  const pendingChanges = useRef<boolean>(false)

  // Start or resume session
  const startSession = useCallback(async () => {
    if (session) return // Already have a session

    setIsLoading(true)
    try {
      const result = await startExamSession({
        examId,
        ipAddress: undefined, // Will be captured server-side
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      })

      if (result.success && result.session) {
        setSession(result.session as unknown as ExamSessionData)
        onSessionStart?.(result.session as unknown as ExamSessionData)
      } else {
        onError?.(result.error || "Failed to start session")
      }
    } catch (error) {
      onError?.("Failed to start session")
    } finally {
      setIsLoading(false)
    }
  }, [examId, session, onSessionStart, onError])

  // Update answer for a question
  const updateAnswer = useCallback((questionId: string, value: AnswerState) => {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(questionId, { ...prev.get(questionId), ...value })
      return next
    })
    pendingChanges.current = true
  }, [])

  // Save answers to server
  const saveAnswers = useCallback(async () => {
    if (!session || !pendingChanges.current) return

    setIsSaving(true)
    try {
      const answersArray: SubmitAnswerPayload[] = Array.from(
        answers.entries()
      ).map(([questionId, value]) => ({
        questionId,
        answerText: value.answerText,
        selectedOptionIds: value.selectedOptionIds,
      }))

      const result = await autoSaveAnswers({
        sessionId: session.id,
        answers: answersArray,
        currentQuestionIndex,
      })

      if (result.success) {
        lastSaveTime.current = Date.now()
        pendingChanges.current = false
        onAutoSave?.()
      }
    } catch (error) {
      console.error("Auto-save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }, [session, answers, currentQuestionIndex, onAutoSave])

  // Submit exam
  const submitExam = useCallback(async () => {
    if (!session) return { success: false, error: "No active session" }

    setIsSubmitting(true)
    try {
      const answersArray: SubmitAnswerPayload[] = Array.from(
        answers.entries()
      ).map(([questionId, value]) => ({
        questionId,
        answerText: value.answerText,
        selectedOptionIds: value.selectedOptionIds,
      }))

      const result = await submitExamSession({
        examId,
        sessionId: session.id,
        answers: answersArray,
      })

      if (result.success) {
        onSubmit?.()
      } else {
        onError?.(result.error || "Failed to submit exam")
      }

      return result
    } catch (error) {
      onError?.("Failed to submit exam")
      return { success: false, error: "Failed to submit exam" }
    } finally {
      setIsSubmitting(false)
    }
  }, [examId, session, answers, onSubmit, onError])

  // Auto-save effect
  useEffect(() => {
    if (!session || autoSaveInterval <= 0) return

    const interval = setInterval(() => {
      if (pendingChanges.current) {
        saveAnswers()
      }
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [session, autoSaveInterval, saveAnswers])

  // Save on visibility change (when user leaves page)
  useEffect(() => {
    if (!session) return

    const handleVisibilityChange = () => {
      if (document.hidden && pendingChanges.current) {
        saveAnswers()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [session, saveAnswers])

  // Check if a question is answered
  const isQuestionAnswered = useCallback(
    (questionId: string): boolean => {
      const answer = answers.get(questionId)
      return (
        (answer?.answerText?.trim() !== "" &&
          answer?.answerText !== undefined) ||
        (answer?.selectedOptionIds !== undefined &&
          answer.selectedOptionIds.length > 0)
      )
    },
    [answers]
  )

  // Get answered question indices
  const getAnsweredIndices = useCallback(
    (questionIds: string[]): Set<number> => {
      const indices = new Set<number>()
      questionIds.forEach((id, idx) => {
        if (isQuestionAnswered(id)) {
          indices.add(idx)
        }
      })
      return indices
    },
    [isQuestionAnswered]
  )

  return {
    session,
    answers,
    isLoading,
    isSaving,
    isSubmitting,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    startSession,
    updateAnswer,
    saveAnswers,
    submitExam,
    isQuestionAnswered,
    getAnsweredIndices,
    pendingChanges: pendingChanges.current,
  }
}
