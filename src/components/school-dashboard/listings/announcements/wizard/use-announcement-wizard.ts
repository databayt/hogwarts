// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getAnnouncementForWizard } from "./actions"

export interface AnnouncementWizardData {
  id: string
  schoolId: string
  title: string | null
  body: string | null
  lang: string
  priority: string
  scope: string
  classId: string | null
  role: string | null
  published: boolean
  scheduledFor: Date | null
  expiresAt: Date | null
  pinned: boolean
  featured: boolean
  wizardStep: string | null
}

export const {
  Provider: AnnouncementWizardProvider,
  useWizardData: useAnnouncementWizard,
} = createWizardProvider<AnnouncementWizardData>("Announcement", {
  loadFn: getAnnouncementForWizard,
})
