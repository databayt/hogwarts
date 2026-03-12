// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getClassForWizard } from "./actions"

export interface ClassWizardData {
  id: string
  schoolId: string
  name: string
  subjectId: string
  teacherId: string
  termId: string
  startPeriodId: string
  endPeriodId: string
  classroomId: string
  gradeId: string | null
  courseCode: string | null
  evaluationType: string
  credits: number | null
  minCapacity: number | null
  maxCapacity: number | null
  duration: number | null
  prerequisiteId: string | null
  wizardStep: string | null
  subject: { id: string; subjectName: string }
  teacher: { id: string; givenName: string; surname: string }
  term: { id: string; name: string }
  startPeriod: { id: string; name: string }
  endPeriod: { id: string; name: string }
  classroom: { id: string; name: string }
  grade: { id: string; name: string } | null
  prerequisite: { id: string; name: string } | null
}

export const { Provider: ClassWizardProvider, useWizardData: useClassWizard } =
  createWizardProvider<ClassWizardData>("Class", {
    loadFn: getClassForWizard,
  })
