// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getAssignmentForWizard } from "./actions"

export interface AssignmentWizardData {
  id: string
  schoolId: string
  classId: string
  title: string
  description: string | null
  type: string
  status: string
  totalPoints: number | string
  weight: number | string
  dueDate: Date | null
  instructions: string | null
  wizardStep: string | null
}

export const {
  Provider: AssignmentWizardProvider,
  useWizardData: useAssignmentWizard,
} = createWizardProvider<AssignmentWizardData>("Assignment", {
  loadFn: getAssignmentForWizard,
})
