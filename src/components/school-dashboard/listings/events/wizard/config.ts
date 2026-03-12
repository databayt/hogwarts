// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const EVENT_WIZARD_CONFIG: WizardConfig = {
  id: "event",
  steps: ["information", "schedule", "settings"],
  groups: {
    1: ["information"],
    2: ["schedule"],
    3: ["settings"],
  },
  groupLabels: ["Event Details", "Schedule", "Settings"],
  requiredSteps: ["information", "schedule"],
  finalLabel: "Complete",
}

export const EVENT_TYPE_OPTIONS = [
  { label: "Academic", value: "ACADEMIC" },
  { label: "Sports", value: "SPORTS" },
  { label: "Cultural", value: "CULTURAL" },
  { label: "Parent Meeting", value: "PARENT_MEETING" },
  { label: "Celebration", value: "CELEBRATION" },
  { label: "Workshop", value: "WORKSHOP" },
  { label: "Other", value: "OTHER" },
]
