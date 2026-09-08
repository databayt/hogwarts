// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export type ReaderLabels = Record<string, string>

export interface BookMeta {
  title: string
  edition: string | null
  lang: string
  dir: "rtl" | "ltr"
  sourcePages: number | null
  /** PDF index − printed page number, when the twin's folios agree. */
  offset: number | null
  notice: string | null
  /** Page markers exist, so `pages/<N>.webp` facsimiles can be shown. */
  hasPageImages: boolean
}

export interface SectionMeta {
  kind: "front" | "chapter" | "chunk"
  /** Running head shown above the page. */
  title: string
  kicker: string | null
  /** PDF pages laid out in this flow, in order. */
  pages: number[]
  chapterIndex: number | null
}

export interface CoverInfo {
  url: string | null
  /** The three lines a textbook prints on its board: stage, title, grade. */
  stage: string | null
  gradeLine: string | null
  description: string | null
  stats: string[]
}
