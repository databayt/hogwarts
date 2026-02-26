// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface CapacityData {
  students: number
  teachers: number
  classSections: number
}

export interface CapacityFormData {
  students: number
  teachers: number
  classSections: number
}

export interface CapacityLimits {
  students: {
    min: number
    max: number
    step: number
  }
  teachers: {
    min: number
    max: number
    step: number
  }
  classSections: {
    min: number
    max: number
    step: number
  }
}

export interface CapacityField {
  id: keyof CapacityData
  label: string
  description?: string
  minValue: number
  step: number
}
