/**
 * Auto-Save Hook for Exam Answers
 *
 * Provides real-time answer synchronization with:
 * - Debounced saving to prevent excessive API calls
 * - Optimistic updates for better UX
 * - Conflict resolution with server state
 * - Offline support with local storage backup
 */

"use client"

import * as React from "react"

import { autoSaveAnswers } from "../actions"

interface AutoSaveConfig {
  sessionId: string
  debounceMs?: number
  maxRetries?: number
  offlineBackup?: boolean
  currentQuestionIndex?: number
}

interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  pendingChanges: boolean
  error: Error | null
  isOffline: boolean
}

interface AnswerData {
  questionId: string
  answerText?: string
  selectedOptionIds?: string[]
  timeSpent?: number
}

const STORAGE_KEY_PREFIX = "exam_answers_"

export function useAutoSave(config: AutoSaveConfig) {
  const {
    sessionId,
    debounceMs = 2000,
    maxRetries = 3,
    offlineBackup = true,
    currentQuestionIndex = 0,
  } = config

  const currentQuestionIndexRef = React.useRef(currentQuestionIndex)

  const [state, setState] = React.useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    pendingChanges: false,
    error: null,
    isOffline: false,
  })

  const answersRef = React.useRef<Map<string, AnswerData>>(new Map())
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = React.useRef(0)

  // Check online status
  React.useEffect(() => {
    const handleOnline = () =>
      setState((prev) => ({ ...prev, isOffline: false }))
    const handleOffline = () =>
      setState((prev) => ({ ...prev, isOffline: true }))

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check
    setState((prev) => ({ ...prev, isOffline: !navigator.onLine }))

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load from local storage on mount (for offline recovery)
  React.useEffect(() => {
    if (!offlineBackup) return

    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, AnswerData>
        answersRef.current = new Map(Object.entries(parsed))
        setState((prev) => ({ ...prev, pendingChanges: true }))
      } catch {
        // Invalid data, clear it
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`)
      }
    }
  }, [sessionId, offlineBackup])

  // Save to local storage (for offline backup)
  const saveToLocalStorage = React.useCallback(() => {
    if (!offlineBackup) return

    const answers = Object.fromEntries(answersRef.current)
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${sessionId}`,
      JSON.stringify(answers)
    )
  }, [sessionId, offlineBackup])

  // Clear local storage backup after successful save
  const clearLocalStorage = React.useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`)
  }, [sessionId])

  // Save answers to server
  const saveToServer = React.useCallback(async () => {
    if (answersRef.current.size === 0) {
      setState((prev) => ({ ...prev, pendingChanges: false }))
      return
    }

    // Don't save if offline - rely on local storage
    if (!navigator.onLine) {
      saveToLocalStorage()
      return
    }

    setState((prev) => ({ ...prev, isSaving: true, error: null }))

    try {
      const answers = Array.from(answersRef.current.values())

      await autoSaveAnswers({
        sessionId,
        answers: answers.map((a) => ({
          questionId: a.questionId,
          answerText: a.answerText,
          selectedOptionIds: a.selectedOptionIds,
        })),
        currentQuestionIndex: currentQuestionIndexRef.current,
      })

      // Success
      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        pendingChanges: false,
        error: null,
      }))

      retryCountRef.current = 0
      clearLocalStorage()
    } catch (error) {
      retryCountRef.current++

      if (retryCountRef.current < maxRetries) {
        // Retry with exponential backoff
        const backoffMs = Math.min(
          1000 * Math.pow(2, retryCountRef.current),
          10000
        )
        saveTimeoutRef.current = setTimeout(saveToServer, backoffMs)
      } else {
        // Max retries reached - save to local storage as backup
        saveToLocalStorage()
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: error instanceof Error ? error : new Error("Save failed"),
        }))
      }
    }
  }, [sessionId, maxRetries, saveToLocalStorage, clearLocalStorage])

  // Debounced save trigger
  const triggerSave = React.useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(saveToServer, debounceMs)
    setState((prev) => ({ ...prev, pendingChanges: true }))
  }, [debounceMs, saveToServer])

  // Update current question index
  const setCurrentQuestionIndex = React.useCallback((index: number) => {
    currentQuestionIndexRef.current = index
  }, [])

  // Update a single answer (for text/short answer questions)
  const updateAnswer = React.useCallback(
    (questionId: string, answerText: string) => {
      answersRef.current.set(questionId, {
        questionId,
        answerText,
        timeSpent: 0,
      })
      triggerSave()
    },
    [triggerSave]
  )

  // Update a single answer with selected options (for MCQ/multiple choice)
  const updateSelectedOptions = React.useCallback(
    (questionId: string, selectedOptionIds: string[]) => {
      answersRef.current.set(questionId, {
        questionId,
        selectedOptionIds,
        timeSpent: 0,
      })
      triggerSave()
    },
    [triggerSave]
  )

  // Update multiple answers at once
  const updateAnswers = React.useCallback(
    (answers: AnswerData[]) => {
      for (const answer of answers) {
        answersRef.current.set(answer.questionId, answer)
      }
      triggerSave()
    },
    [triggerSave]
  )

  // Force immediate save (e.g., before submit)
  const forceSave = React.useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    await saveToServer()
  }, [saveToServer])

  // Get current answers
  const getAnswers = React.useCallback(() => {
    return new Map(answersRef.current)
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Final save attempt on unmount
      if (answersRef.current.size > 0 && offlineBackup) {
        saveToLocalStorage()
      }
    }
  }, [offlineBackup, saveToLocalStorage])

  // Sync when coming back online
  React.useEffect(() => {
    if (!state.isOffline && state.pendingChanges) {
      saveToServer()
    }
  }, [state.isOffline, state.pendingChanges, saveToServer])

  return {
    ...state,
    updateAnswer,
    updateSelectedOptions,
    updateAnswers,
    setCurrentQuestionIndex,
    forceSave,
    getAnswers,
  }
}
