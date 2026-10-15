// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Label lookups for the membership block. The membership dictionary is a
 * flat string map (`role_ADMIN`, `joinMethod_INVITATION`), so enum codes
 * resolve through `t[prefix_code]` and fall back to the humanised code.
 */
type Dict = Record<string, string>

const humanise = (value: string) => value.replace(/_/g, " ").toLowerCase()

export function roleLabel(t: Dict, role: string | null | undefined): string {
  if (!role) return ""
  return t[`role_${role}`] ?? humanise(role)
}

export function joinMethodLabel(
  t: Dict,
  method: string | null | undefined
): string {
  if (!method) return ""
  return t[`joinMethod_${method}`] ?? humanise(method)
}

/** Substitute `{name}` placeholders. */
export function fillT(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (m, k) =>
    k in values ? String(values[k]) : m
  )
}
