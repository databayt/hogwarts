// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ContactCategory, SidebarFilter } from "./types"

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

/** Sidebar filter badges: All, Unread, [role categories], Favourites */
export function getSidebarFilters(
  role: string
): { key: SidebarFilter; label: string }[] {
  const categories = ROLE_CATEGORIES[role] ?? []
  return [
    { key: "all", label: "all" },
    { key: "unread", label: "unread" },
    ...categories.map((c) => ({
      key: c as SidebarFilter,
      label: CATEGORY_DICT_KEYS[c],
    })),
    { key: "favourites", label: "favourites" },
  ]
}

/** Max contacts per category */
export const MAX_CONTACTS_PER_CATEGORY = 50
