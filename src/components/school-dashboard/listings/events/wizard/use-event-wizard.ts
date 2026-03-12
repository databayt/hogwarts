// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getEventForWizard } from "./actions"

export interface EventWizardData {
  id: string
  schoolId: string
  title: string
  description: string | null
  eventType: string
  eventDate: Date
  startTime: string
  endTime: string
  location: string | null
  organizer: string | null
  targetAudience: string | null
  maxAttendees: number | null
  isPublic: boolean
  registrationRequired: boolean
  notes: string | null
  status: string
  wizardStep: string | null
}

export const { Provider: EventWizardProvider, useWizardData: useEventWizard } =
  createWizardProvider<EventWizardData>("Event", {
    loadFn: getEventForWizard,
  })
