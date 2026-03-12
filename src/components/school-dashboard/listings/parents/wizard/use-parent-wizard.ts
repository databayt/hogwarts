// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getParentForWizard } from "./actions"

export interface ParentWizardData {
  id: string
  schoolId: string
  givenName: string
  surname: string
  lang: string
  emailAddress: string | null
  teacherId: string | null
  profilePhotoUrl: string | null
  userId: string | null
  wizardStep: string | null
  phoneNumbers: {
    id: string
    phoneNumber: string
    phoneType: string
    isPrimary: boolean
  }[]
}

export const {
  Provider: ParentWizardProvider,
  useWizardData: useParentWizard,
} = createWizardProvider<ParentWizardData>("Parent", {
  loadFn: getParentForWizard,
})
