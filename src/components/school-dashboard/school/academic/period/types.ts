// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Types for period
export type PeriodRow = {
  id: string
  yearId: string
  yearName: string
  name: string
  startTime: string
  endTime: string
  createdAt: string
}

export type PeriodDetail = {
  id: string
  schoolId: string
  yearId: string
  name: string
  startTime: Date
  endTime: Date
  createdAt: Date
  updatedAt: Date
  schoolYear: {
    id: string
    yearName: string
  }
}
