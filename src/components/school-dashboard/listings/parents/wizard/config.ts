// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Configuration for Parents wizard
 *
 * Static PARENT_WIZARD_CONFIG is kept for non-UI contexts (e.g., step routing,
 * server-side logic). For UI display, use the dictionary-based factory function
 * that accepts a parents dictionary section.
 */

import type { WizardConfig } from "@/components/form/wizard"

export const PARENT_WIZARD_CONFIG: WizardConfig = {
  id: "parent",
  steps: ["information", "contact"],
  groups: {
    1: ["information"],
    2: ["contact"],
  },
  groupLabels: ["Personal Info", "Contact Details"],
  i18nGroupLabels: {
    ar: ["المعلومات الشخصية", "بيانات التواصل"],
    en: ["Personal Info", "Contact Details"],
  },
  requiredSteps: ["information"],
  finalLabel: "Complete",
  i18nFinalLabel: {
    ar: "إكمال",
    en: "Complete",
  },
}

// --- Dictionary-based factory functions ---
// These accept the parents dictionary section (Record<string, any>)
// and fall back to English defaults when dictionary is not yet loaded.
// Expected dictionary path: dictionary.school.parents.wizard.*

type ParentsDict = Record<string, any> | undefined

/** Build a localized WizardConfig using dictionary values */
export const getParentWizardConfig = (d?: ParentsDict): WizardConfig => {
  const w = d?.wizard as Record<string, any> | undefined
  return {
    ...PARENT_WIZARD_CONFIG,
    groupLabels: [
      w?.personalInfo || "Personal Info",
      w?.contactDetails || "Contact Details",
    ],
    finalLabel: w?.complete || "Complete",
  }
}

/** Group labels for display outside the wizard (e.g., breadcrumbs, headers) */
export const getWizardGroupLabels = (d?: ParentsDict) => {
  const w = d?.wizard as Record<string, any> | undefined
  return [
    w?.personalInfo || "Personal Info",
    w?.contactDetails || "Contact Details",
  ]
}

/** Final action label */
export const getWizardFinalLabel = (d?: ParentsDict) => {
  const w = d?.wizard as Record<string, any> | undefined
  return w?.complete || "Complete"
}
