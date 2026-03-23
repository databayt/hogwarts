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

/** Dictionary-based factory for wizard config labels */
export const getEventWizardConfig = (d?: Record<string, any>): WizardConfig => {
  const wc = d?.wizard?.config as Record<string, string> | undefined
  return {
    ...EVENT_WIZARD_CONFIG,
    groupLabels: [
      wc?.eventDetails || "Event Details",
      wc?.schedule || "Schedule",
      wc?.settings || "Settings",
    ],
    finalLabel: wc?.complete || "Complete",
  }
}

/** Dictionary-based event type options */
export const getEventTypeOptions = (d?: Record<string, any>) => {
  const t = d?.types as Record<string, string> | undefined
  return [
    { label: t?.ACADEMIC || "Academic", value: "ACADEMIC" },
    { label: t?.SPORTS || "Sports", value: "SPORTS" },
    { label: t?.CULTURAL || "Cultural", value: "CULTURAL" },
    { label: t?.PARENT_MEETING || "Parent Meeting", value: "PARENT_MEETING" },
    { label: t?.CELEBRATION || "Celebration", value: "CELEBRATION" },
    { label: t?.WORKSHOP || "Workshop", value: "WORKSHOP" },
    { label: t?.OTHER || "Other", value: "OTHER" },
  ]
}

/** Keep static fallback for non-dictionary contexts */
export const EVENT_TYPE_OPTIONS = [
  { label: "Academic", value: "ACADEMIC" },
  { label: "Sports", value: "SPORTS" },
  { label: "Cultural", value: "CULTURAL" },
  { label: "Parent Meeting", value: "PARENT_MEETING" },
  { label: "Celebration", value: "CELEBRATION" },
  { label: "Workshop", value: "WORKSHOP" },
  { label: "Other", value: "OTHER" },
]
