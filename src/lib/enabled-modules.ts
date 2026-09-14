// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * School.enabledModules is a Json column holding the sidebar's module keys.
 * null means every module is visible. Until 2026-09 the mobile attendance
 * methods route wrote an object into it ({ attendanceMethods: [...] }), so a
 * non-array value is read as "not configured" rather than crashing `.includes`.
 */
export function parseEnabledModules(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value.filter((key): key is string => typeof key === "string")
}
