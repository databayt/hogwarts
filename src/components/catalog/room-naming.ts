// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Default homeroom classroom name for a section:
 * `<section letter><2-digit grade number>` — e.g. Grade 1 → A01 (section A),
 * B01 (section B); Grade 12 → A12, B12. Grade-assigned (not shared).
 *
 * Single source of truth shared by `autoProvisionSections` (the "Sync defaults"
 * button) and the Configure tab's `generateSections`, so the two provisioning
 * paths can never drift apart.
 */
export function defaultRoomName(letter: string, gradeNumber: number): string {
  return `${letter}${String(gradeNumber).padStart(2, "0")}`
}
