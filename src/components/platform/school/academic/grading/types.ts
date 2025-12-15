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
