// Types for year level
export type YearLevelRow = {
  id: string
  levelName: string
  lang: string
  levelOrder: number
  createdAt: string
  _count?: {
    batches: number
    studentYearLevels: number
  }
}

export type YearLevelDetail = {
  id: string
  schoolId: string
  levelName: string
  lang: string
  levelOrder: number
  createdAt: Date
  updatedAt: Date
}
