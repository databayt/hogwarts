// Types for year level
export type YearLevelRow = {
  id: string
  levelName: string
  levelNameAr: string | null
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
  levelNameAr: string | null
  levelOrder: number
  createdAt: Date
  updatedAt: Date
}
