// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

/** Dictionary-driven gender options */
export function getGenderOptions(
  dictionary?: Dictionary["school"]["students"]
) {
  const info = dictionary?.information as Record<string, string> | undefined
  return [
    { label: info?.male || "Male", value: "male" },
    { label: info?.female || "Female", value: "female" },
  ]
}
