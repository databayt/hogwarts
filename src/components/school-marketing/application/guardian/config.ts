// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const GUARDIAN_STEP_CONFIG = {
  id: "guardian",
}

type OptionDict = Record<string, string>

export const getGuardianRelationOptions = (d: OptionDict) => [
  { value: "grandfather", label: d.grandfather || "Grandfather" },
  { value: "grandmother", label: d.grandmother || "Grandmother" },
  { value: "uncle", label: d.uncle || "Uncle" },
  { value: "aunt", label: d.aunt || "Aunt" },
  { value: "other", label: d.other || "Other" },
]
