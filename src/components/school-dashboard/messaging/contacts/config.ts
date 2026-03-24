// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Configuration for Messaging Contacts module
 *
 * Static options (ROLE_CATEGORIES, CATEGORY_DICT_KEYS etc.) are kept for
 * non-UI contexts (e.g., server-side filtering, permission checks). For UI
 * display, use the dictionary-based factory functions that accept a messaging
 * contacts dictionary section.
 */

import type { ContactCategory } from "./types"

/** Which contact categories each role sees, in display order */
export const ROLE_CATEGORIES: Record<string, ContactCategory[]> = {
  DEVELOPER: [
    "admin",
    "teachers",
    "students",
    "parents",
    "staff",
    "accountants",
  ],
  ADMIN: ["teachers", "students", "parents", "staff", "accountants"],
  TEACHER: ["my_students", "parents", "teachers", "staff", "admin"],
  STUDENT: ["my_teachers", "classmates", "admin"],
  GUARDIAN: ["my_children_teachers", "admin"],
  ACCOUNTANT: ["admin", "staff", "teachers"],
  STAFF: ["admin", "teachers", "staff", "accountants"],
}

/** Dictionary key for each category label */
export const CATEGORY_DICT_KEYS: Record<string, string> = {
  teachers: "teachers",
  students: "students",
  parents: "parents",
  staff: "staff",
  admin: "admin",
  accountants: "accountants",
  my_students: "my_students",
  my_teachers: "my_teachers",
  classmates: "classmates",
  my_children_teachers: "my_children_teachers",
}

/** Filter chip categories shown in the search bar per role */
export function getFilterChips(
  role: string
): { key: ContactCategory | "all"; label: string }[] {
  const categories = ROLE_CATEGORIES[role] ?? []
  return [
    { key: "all" as const, label: "all" },
    ...categories.map((c) => ({ key: c, label: CATEGORY_DICT_KEYS[c] })),
  ]
}

/** Max contacts per category */
export const MAX_CONTACTS_PER_CATEGORY = 50

// --- Dictionary-based factory functions ---
// These accept the messaging contacts dictionary section (Record<string, any>)
// and fall back to English defaults when dictionary is not yet loaded.
// Expected dictionary path: dictionary.school.messaging.contacts.*

type ContactsDict = Record<string, any> | undefined

/** Get localized category labels from dictionary */
export const getCategoryLabels = (d?: ContactsDict): Record<string, string> => {
  const c = d?.categories as Record<string, string> | undefined
  return {
    teachers: c?.teachers || "Teachers",
    students: c?.students || "Students",
    parents: c?.parents || "Parents",
    staff: c?.staff || "Staff",
    admin: c?.admin || "Admin",
    accountants: c?.accountants || "Accountants",
    my_students: c?.myStudents || "My Students",
    my_teachers: c?.myTeachers || "My Teachers",
    classmates: c?.classmates || "Classmates",
    my_children_teachers: c?.myChildrenTeachers || "My Children's Teachers",
    all: c?.all || "All",
  }
}

/** Get localized filter chips with dictionary labels */
export const getLocalizedFilterChips = (
  role: string,
  d?: ContactsDict
): { key: ContactCategory | "all"; label: string }[] => {
  const labels = getCategoryLabels(d)
  const categories = ROLE_CATEGORIES[role] ?? []
  return [
    { key: "all" as const, label: labels.all },
    ...categories.map((c) => ({ key: c, label: labels[c] || c })),
  ]
}
