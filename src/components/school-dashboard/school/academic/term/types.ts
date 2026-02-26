// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Types for term
export type TermRow = {
  id: string
  yearId: string
  yearName: string
  termNumber: number
  termName: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

export type TermDetail = {
  id: string
  schoolId: string
  yearId: string
  termNumber: number
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  schoolYear: {
    id: string
    yearName: string
  }
}
