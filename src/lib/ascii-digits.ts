// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Arabic keyboards type Arabic-Indic (٠-٩) or Eastern Arabic-Indic (۰-۹)
 * digits. Usernames and PINs mean the ASCII digits, so sign-in folds them.
 * Pure — no imports.
 */
export function toAsciiDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}
