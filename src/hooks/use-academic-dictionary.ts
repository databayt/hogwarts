import { useMemo } from "react"

import type { Dictionary } from "@/components/internationalization/dictionaries"

/**
 * Academic dictionary type with common translation keys
 */
export interface AcademicDictionary {
  // Page
  title?: string
  description?: string

  // Years
  academicYears?: string
  addYear?: string
  editYear?: string
  yearName?: string
  yearNameHint?: string
  yearFormDescription?: string
  yearsDescription?: string
  noYears?: string
  addYearHint?: string
  deleteYearConfirm?: string
  selected?: string

  // Terms
  terms?: string
  term?: string
  addTerm?: string
  editTerm?: string
  termNumber?: string
  selectTerm?: string
  termFormDescription?: string
  termsFor?: string
  termsDescription?: string
  noTerms?: string
  addTermHint?: string
  setActive?: string
  active?: string
  activeTerm?: string
  deleteTermConfirm?: string
  selectYearFirst?: string

  // Periods
  periods?: string
  dailyPeriods?: string
  addPeriod?: string
  editPeriod?: string
  periodName?: string
  periodFormDescription?: string
  periodsFor?: string
  periodsDescription?: string
  noPeriods?: string
  addPeriodHint?: string
  deletePeriodConfirm?: string

  // Common
  add?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  cancel?: string
  saveChanges?: string
  delete?: string
  edit?: string
  duration?: string
  minutes?: string
  selectYear?: string
  retry?: string
  confirmDelete?: string
  deleteWarning?: string
}

/**
 * Hook to extract and memoize academic dictionary from the main dictionary.
 * Provides type-safe access to translation keys with fallbacks.
 *
 * @example
 * ```tsx
 * const dict = useAcademicDictionary(dictionary)
 * return <h1>{dict.academicYears || "Academic Years"}</h1>
 * ```
 */
export function useAcademicDictionary(
  dictionary?: Dictionary
): AcademicDictionary {
  return useMemo(() => {
    if (!dictionary?.school) return {}
    const school = dictionary.school as Record<string, unknown>
    if (!school.academic) return {}
    return school.academic as AcademicDictionary
  }, [dictionary])
}

/**
 * Non-hook version for server components.
 * Use this when you need the dictionary in a server component.
 */
export function getAcademicDictionary(
  dictionary?: Dictionary
): AcademicDictionary {
  if (!dictionary?.school) return {}
  const school = dictionary.school as Record<string, unknown>
  if (!school.academic) return {}
  return school.academic as AcademicDictionary
}
