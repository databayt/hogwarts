// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  BookOpen,
  CircleHelp,
  ClipboardList,
  Library,
  Package,
  PlayCircle,
  type LucideIcon,
} from "lucide-react"

import type { CommunityResourceType } from "./types"

export interface CommunityResourceTypeMeta {
  id: CommunityResourceType
  /** key into `dictionary.community.types[id]` */
  dictKey: CommunityResourceType
  href: string
  icon: LucideIcon
}

/**
 * Single source of truth for the six community resource types.
 *
 * Order matters — drives the `<HubGrid>` card sequence and the directory order
 * of nested route folders.
 */
export const RESOURCE_TYPES: readonly CommunityResourceTypeMeta[] = [
  {
    id: "textbooks",
    dictKey: "textbooks",
    href: "/community/textbooks",
    icon: BookOpen,
  },
  {
    id: "exams",
    dictKey: "exams",
    href: "/community/exams",
    icon: ClipboardList,
  },
  {
    id: "qbank",
    dictKey: "qbank",
    href: "/community/qbank",
    icon: CircleHelp,
  },
  {
    id: "videos",
    dictKey: "videos",
    href: "/community/videos",
    icon: PlayCircle,
  },
  {
    id: "materials",
    dictKey: "materials",
    href: "/community/materials",
    icon: Package,
  },
  {
    id: "books",
    dictKey: "books",
    href: "/community/books",
    icon: Library,
  },
] as const

export const DEFAULT_RESOURCE_LIMIT = 24
