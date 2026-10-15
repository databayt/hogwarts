// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * School days in a planned absence, by the school's own working week
 * (`SchoolWeekConfig.workingDays`, JS getDay() convention). The fallback is
 * Sun–Thu — the Sudan/Gulf week our schools run — not Mon–Fri. Client-safe:
 * the submit form shows the same count the server stores.
 */
export const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4]

export function countSchoolDays(
  dateFrom: Date,
  dateTo: Date,
  workingDays: number[] = DEFAULT_WORKING_DAYS
): number {
  const days = workingDays.length > 0 ? workingDays : DEFAULT_WORKING_DAYS
  let count = 0
  const current = new Date(dateFrom)
  while (current <= dateTo) {
    if (days.includes(current.getDay())) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}
