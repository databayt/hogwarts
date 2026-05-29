// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tiny mustache-flavored template renderer for NotificationTemplate rows.
 *
 * Contract (matches the comment in `prisma/models/notifications.prisma`):
 *
 *   "{{studentName}} received {{grade}} in {{subject}}"
 *   + { studentName: "Ali", grade: "A", subject: "Math" }
 *   = "Ali received A in Math"
 *
 * Missing variables stay as the literal `{{name}}` so the failure is
 * obvious in QA rather than silently producing "Ali received  in ".
 *
 * We intentionally do NOT pull in Handlebars or Mustache here — this lives
 * on the hot dispatch path; a 20-line regex is sufficient and avoids a
 * runtime dep for what's effectively string interpolation.
 */
export function renderTemplate(
  template: string,
  metadata?: Record<string, unknown>
): string {
  if (!metadata) return template
  return template.replace(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
    (m, key) => {
      const value = metadata[key]
      if (value === undefined || value === null) return m // leave placeholder visible
      return String(value)
    }
  )
}
