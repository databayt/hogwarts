// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Types for school year
export type SchoolYearRow = {
  id: string
  yearName: string
  startDate: string
  endDate: string
  createdAt: string
  _count?: {
    terms: number
    periods: number
  }
}

export type SchoolYearDetail = {
  id: string
  schoolId: string
  yearName: string
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
  terms: Array<{
    id: string
    termNumber: number
    startDate: Date
    endDate: Date
    isActive: boolean
  }>
  periods: Array<{
    id: string
    name: string
    startTime: Date
    endTime: Date
  }>
}
