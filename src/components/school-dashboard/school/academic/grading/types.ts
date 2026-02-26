// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Types for score range (grading scale)
export type ScoreRangeRow = {
  id: string
  minScore: number
  maxScore: number
  grade: string
  createdAt: string
}

export type ScoreRangeDetail = {
  id: string
  schoolId: string
  minScore: number
  maxScore: number
  grade: string
  createdAt: Date
  updatedAt: Date
}
