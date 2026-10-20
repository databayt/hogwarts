"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react"

import { parseEnabledModules } from "@/lib/enabled-modules"
import type { School } from "@/components/school-marketing/types"

interface SchoolContextValue {
  school: School
  /**
   * Optimistic override for `school.enabledModules`, so the dashboard sidebar
   * follows the modules config the moment a card is clicked instead of
   * waiting for the save + RSC refresh. `null` = every module enabled.
   */
  setEnabledModules: (modules: string[] | null) => void
}

export const SchoolContext = createContext<SchoolContextValue | undefined>(
  undefined
)

interface SchoolProviderProps {
  children: ReactNode
  school: School
}

export function SchoolProvider({ children, school }: SchoolProviderProps) {
  // `undefined` = no pending change; the server value is shown as-is.
  const [override, setOverride] = useState<string[] | null | undefined>(
    undefined
  )

  // Once a refresh brings the server value in line with the override, drop
  // it so a later change made elsewhere (another admin) is not masked.
  if (
    override !== undefined &&
    sameModules(parseEnabledModules(school.enabledModules), override)
  ) {
    setOverride(undefined)
  }

  const value = useMemo<SchoolContextValue>(
    () => ({
      school:
        override === undefined
          ? school
          : { ...school, enabledModules: override },
      setEnabledModules: setOverride,
    }),
    [school, override]
  )

  return (
    <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
  )
}

function sameModules(a: string[] | null, b: string[] | null) {
  if (a === null || b === null) return a === b
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((key) => set.has(key))
}

export function useSchool() {
  const context = useContext(SchoolContext)
  if (context === undefined) {
    throw new Error("useSchool must be used within a SchoolProvider")
  }
  return context
}
