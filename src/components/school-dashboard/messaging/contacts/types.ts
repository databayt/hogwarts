// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"

/** Unified contact representation across all domain models */
export type ContactDTO = {
  /** User.id — used for creating direct conversations */
  id: string
  givenName: string
  surname: string
  displayName: string
  email: string | null
  image: string | null
  role: UserRole
  category: ContactCategory
  /** Contextual info: section name, department, position */
  contextLabel?: string
  /** Conversation enrichment (client-side merge) */
  conversationId?: string
  lastMessage?: string | null
  lastMessageAt?: Date | string | null
  unreadCount?: number
  isPinned?: boolean
}

/** Contact categories — some are role-specific (prefixed with my_) */
export type ContactCategory =
  | "teachers"
  | "students"
  | "parents"
  | "staff"
  | "admin"
  | "accountants"
  | "my_students"
  | "my_teachers"
  | "classmates"
  | "my_children_teachers"

/** Sidebar filter type — includes all, unread, favourites + role categories */
export type SidebarFilter = "all" | "unread" | ContactCategory | "favourites"

/** Filters for the contacts panel */
export type ContactFilters = {
  search?: string
  category?: ContactCategory | "all"
}

/** A group of contacts under a category header */
export type ContactGroup = {
  category: ContactCategory
  contacts: ContactDTO[]
}
