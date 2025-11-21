'use client';

import { useCallback, useEffect, useState } from 'react';

export type ViewMode = 'list' | 'grid';

export interface UseViewModeOptions {
  /** Default view mode */
  defaultMode?: ViewMode;
  /** Storage key for persisting preference */
  storageKey?: string;
  /** Callback when mode changes */
  onModeChange?: (mode: ViewMode) => void;
}

export interface UseViewModeReturn {
  /** Current view mode */
  mode: ViewMode;
  /** Set view mode */
  setMode: (mode: ViewMode) => void;
  /** Toggle between modes */
  toggleMode: () => void;
  /** Check if list mode */
  isList: boolean;
  /** Check if grid mode */
  isGrid: boolean;
}

/**
 * Hook for managing view mode state
 */
export function useViewMode({
  defaultMode = 'list',
  storageKey = 'view-mode-preference',
  onModeChange
}: UseViewModeOptions = {}): UseViewModeReturn {
  const [mode, setModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'list' || stored === 'grid') {
        return stored;
      }
    }
    return defaultMode;
  });

  // Persist to localStorage
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, mode);
    }
  }, [mode, storageKey]);

  // Notify on change
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  const setMode = useCallback((newMode: ViewMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(current => current === 'list' ? 'grid' : 'list');
  }, []);

  return {
    mode,
    setMode,
    toggleMode,
    isList: mode === 'list',
    isGrid: mode === 'grid'
  };
}