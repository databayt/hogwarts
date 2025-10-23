/**
 * Theme Editor Store
 *
 * Zustand store for theme editor state management with undo/redo functionality.
 * Based on tweakcn's pattern with history management and checkpoints.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeEditorState } from '@/types/theme-editor'
import { defaultThemeState } from '@/components/theme/config'

const MAX_HISTORY_COUNT = 30
const HISTORY_OVERRIDE_THRESHOLD_MS = 500 // 0.5 seconds

interface ThemeHistoryEntry {
  state: ThemeEditorState
  timestamp: number
}

interface EditorStore {
  themeState: ThemeEditorState
  themeCheckpoint: ThemeEditorState | null
  history: ThemeHistoryEntry[]
  future: ThemeHistoryEntry[]
  setThemeState: (state: ThemeEditorState) => void
  saveThemeCheckpoint: () => void
  restoreThemeCheckpoint: () => void
  hasUnsavedChanges: () => boolean
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

// Helper to deep compare objects (simplified)
function isDeepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      themeState: defaultThemeState,
      themeCheckpoint: null,
      history: [],
      future: [],

      setThemeState: (newState: ThemeEditorState) => {
        const oldThemeState = get().themeState
        let currentHistory = get().history
        let currentFuture = get().future

        // Check if only currentMode changed
        const oldStateWithoutMode = { ...oldThemeState, currentMode: undefined }
        const newStateWithoutMode = { ...newState, currentMode: undefined }

        if (
          isDeepEqual(oldStateWithoutMode, newStateWithoutMode) &&
          oldThemeState.currentMode !== newState.currentMode
        ) {
          // Only currentMode changed - just update themeState without affecting history
          set({ themeState: newState })
          return
        }

        const currentTime = Date.now()
        const lastHistoryEntry =
          currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null

        if (
          !lastHistoryEntry ||
          currentTime - lastHistoryEntry.timestamp >= HISTORY_OVERRIDE_THRESHOLD_MS
        ) {
          // Add a new history entry
          currentHistory = [...currentHistory, { state: oldThemeState, timestamp: currentTime }]
          currentFuture = []
        }

        if (currentHistory.length > MAX_HISTORY_COUNT) {
          currentHistory.shift() // Remove the oldest entry
        }

        set({
          themeState: newState,
          history: currentHistory,
          future: currentFuture,
        })
      },

      saveThemeCheckpoint: () => {
        set({ themeCheckpoint: get().themeState })
      },

      restoreThemeCheckpoint: () => {
        const checkpoint = get().themeCheckpoint
        if (checkpoint) {
          const oldThemeState = get().themeState
          const oldHistory = get().history
          const currentTime = Date.now()

          const newHistoryEntry = { state: oldThemeState, timestamp: currentTime }
          let updatedHistory = [...oldHistory, newHistoryEntry]
          if (updatedHistory.length > MAX_HISTORY_COUNT) {
            updatedHistory.shift()
          }

          set({
            themeState: {
              ...checkpoint,
              currentMode: get().themeState.currentMode,
            },
            history: updatedHistory,
            future: [],
          })
        } else {
          console.warn('No theme checkpoint available to restore to.')
        }
      },

      hasUnsavedChanges: () => {
        const checkpoint = get().themeCheckpoint
        const current = get().themeState
        return !isDeepEqual(current, checkpoint)
      },

      undo: () => {
        const history = get().history
        if (history.length === 0) {
          return
        }

        const currentThemeState = get().themeState
        const future = get().future

        const lastHistoryEntry = history[history.length - 1]
        const newHistory = history.slice(0, -1)

        const newFutureEntry = { state: currentThemeState, timestamp: Date.now() }
        const newFuture = [newFutureEntry, ...future]

        set({
          themeState: {
            ...lastHistoryEntry.state,
            currentMode: currentThemeState.currentMode,
          },
          history: newHistory,
          future: newFuture,
        })
      },

      redo: () => {
        const future = get().future
        if (future.length === 0) {
          return
        }
        const history = get().history

        const firstFutureEntry = future[0]
        const newFuture = future.slice(1)

        const currentThemeState = get().themeState

        const newHistoryEntry = { state: currentThemeState, timestamp: Date.now() }
        let updatedHistory = [...history, newHistoryEntry]
        if (updatedHistory.length > MAX_HISTORY_COUNT) {
          updatedHistory.shift()
        }

        set({
          themeState: {
            ...firstFutureEntry.state,
            currentMode: currentThemeState.currentMode,
          },
          history: updatedHistory,
          future: newFuture,
        })
      },

      canUndo: () => get().history.length > 0,
      canRedo: () => get().future.length > 0,
    }),
    {
      name: 'theme-editor-storage',
    }
  )
)
