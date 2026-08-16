// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

/** The `school.liveClasses` slice every landing section reads its copy from. */
export type ConferenceDictionary = Dictionary["school"]["liveClasses"]

export interface LandingSectionProps {
  dictionary: ConferenceDictionary
  lang: string
}

/** One row in the live / coming-up strip, already localized by the page. */
export interface LandingSession {
  id: string
  title: string
  teacherName: string
  subjectName: string | null
  sectionName: string | null
  /** ISO string — formatted in the client component, in the reader's locale. */
  scheduledStart: string
  isLive: boolean
}
