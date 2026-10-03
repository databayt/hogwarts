// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getParentForWizard } from "./actions"

export interface ParentWizardData {
  id: string
  schoolId: string
  firstName: string
  lastName: string
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

/**
 * What `getParentForWizard` returns for a row `createDraftParent` has just
 * written — the wizard opens on this while the INSERT is still in flight.
 */
export function emptyParentDraft(id: string): ParentWizardData {
  return {
    id,
    schoolId: "",
    firstName: "",
    lastName: "",
    lang: "ar",
    emailAddress: null,
    teacherId: null,
    profilePhotoUrl: null,
    userId: null,
    wizardStep: "information",
    phoneNumbers: [],
  }
}

export const {
  Provider: ParentWizardProvider,
  useWizardData: useParentWizard,
} = createWizardProvider<ParentWizardData>("Parent", {
  loadFn: getParentForWizard,
})
